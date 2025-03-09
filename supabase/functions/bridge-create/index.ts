
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Validate required environment variables
const API_KEY = Deno.env.get("FF_API_KEY");
const API_SECRET = Deno.env.get("FF_API_SECRET");
const API_URL = "https://ff.io/api/v2/create";

if (!API_KEY || !API_SECRET) {
  console.error("Missing required environment variables: FF_API_KEY and/or FF_API_SECRET");
}

// Enhanced CORS headers to ensure proper cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, x-client-info, content-type, authorization, X-API-KEY, X-API-SIGN",
  "Access-Control-Max-Age": "86400",
};

// Generate HMAC signature for FixedFloat API
function generateSignature(message: string): string {
  // Use native Deno crypto for synchronous HMAC
  const encoder = new TextEncoder();
  const key = encoder.encode(API_SECRET || "");
  const data = encoder.encode(message);
  
  const signature = crypto.subtle.digestSync(
    "SHA-256",
    crypto.subtle.hmacKeyInit({
      name: "HMAC",
      hash: "SHA-256",
      key,
    }).key,
    data
  );
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  console.log(`Received ${req.method} request to bridge-create`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Responding to CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body and log it
    const requestData = await req.json();
    const requestBodyStr = JSON.stringify(requestData);
    
    console.log("------------------------------------");
    console.log("REQUEST DETAILS:");
    console.log("Request URL:", API_URL);
    console.log("Request body:", requestBodyStr);
    
    // Generate signature for the exact string we're sending
    const signature = generateSignature(requestBodyStr);
    console.log("Generated signature:", signature);
    console.log("Using API key:", API_KEY);
    
    // Log equivalent curl command for debugging
    console.log("\nEquivalent curl command:");
    console.log(`curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: ${API_KEY}" \\
  -H "X-API-SIGN: ${signature}" \\ 
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '${requestBodyStr}' \\ 
  "${API_URL}" -L`);
    
    // Make request to FixedFloat API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "X-API-KEY": API_KEY || "",
        "X-API-SIGN": signature,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: requestBodyStr,
    });
    
    // Log response status and headers
    console.log("\nRESPONSE DETAILS:");
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Get response body as text first for logging
    const responseText = await response.text();
    console.log("Response body (text):", responseText);
    console.log("------------------------------------");
    
    // Parse response if it's JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return new Response(
        JSON.stringify({
          code: 500,
          msg: "Failed to parse response from API",
          error: responseText,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Return API response to client
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        code: 500,
        msg: error instanceof Error ? error.message : "Internal server error",
        data: null,
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
