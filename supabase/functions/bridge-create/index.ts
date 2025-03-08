
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Validate required environment variables
const API_KEY = Deno.env.get("FF_API_KEY");
const API_SECRET = Deno.env.get("FF_API_SECRET");
const API_URL = "https://ff.io/api/v2/create";

if (!API_KEY || !API_SECRET) {
  console.error("Missing required environment variables: FF_API_KEY and/or FF_API_SECRET");
}

// Generate HMAC signature for FixedFloat API
function generateSignature(body: string): string {
  const key = new TextEncoder().encode(API_SECRET || "");
  const message = new TextEncoder().encode(body);
  
  // Create HMAC using SHA-256
  const hmac = crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key => crypto.subtle.sign(
    "HMAC",
    key,
    message
  )).then(signature => {
    // Convert signature to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  });
  
  return hmac;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-KEY, X-API-SIGN",
      },
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log("Create order request:", requestData);
    
    // Validate required parameters
    if (!requestData.fromCcy || !requestData.toCcy || !requestData.amount || !requestData.toAddress) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing required parameters",
          data: null,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
    
    // Prepare request body for FixedFloat API
    const requestBody = JSON.stringify({
      fromCcy: requestData.fromCcy,
      toCcy: requestData.toCcy,
      amount: requestData.amount,
      direction: requestData.direction || "from",
      type: requestData.type || "fixed",
      toAddress: requestData.toAddress,
    });
    
    // Generate signature
    const signature = await generateSignature(requestBody);
    
    console.log("Sending request to FixedFloat API");
    console.log("URL:", API_URL);
    console.log("Body:", requestBody);
    console.log("Signature:", signature);
    
    // Make request to FixedFloat API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "X-API-KEY": API_KEY || "",
        "X-API-SIGN": signature,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: requestBody,
    });
    
    // Parse API response
    const responseData = await response.json();
    console.log("FixedFloat API response:", responseData);
    
    // Return API response to client
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        code: 500,
        msg: error.message || "Internal server error",
        data: null,
        error: error,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
