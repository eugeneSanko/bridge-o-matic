
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-KEY, X-API-SIGN, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

// Generate HMAC signature for FixedFloat API (synchronous version)
function generateSignature(body: string): string {
  const encoder = new TextEncoder();
  const key = encoder.encode(API_SECRET || "");
  const message = encoder.encode(body);
  
  // Create HMAC using SHA-256 with the Web Crypto API (synchronous method for Deno)
  const keyData = new Uint8Array(key);
  const msgData = new Uint8Array(message);
  
  // Deno provides a native crypto implementation
  const digest = crypto.subtle.digestSync("HMAC-SHA-256", keyData, msgData);
  
  // Convert to hex string
  return Array.from(new Uint8Array(digest))
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
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    // Validate required parameters
    if (!requestData.fromCcy || !requestData.toCcy || !requestData.amount || !requestData.toAddress) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing required parameters: fromCcy, toCcy, amount, toAddress are required",
          data: null,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
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
    
    // Generate signature using the improved method
    const signature = generateSignature(requestBody);
    
    console.log("Making request to FixedFloat API:");
    console.log("URL:", API_URL);
    console.log("Body:", requestBody);
    console.log("X-API-KEY:", API_KEY);
    console.log("X-API-SIGN:", signature);
    
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
    
    // Check for HTTP error status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FixedFloat API error (${response.status}):`, errorText);
      
      return new Response(
        JSON.stringify({
          code: response.status,
          msg: `API Error: ${response.statusText}`,
          data: null,
          error: errorText,
        }),
        {
          status: 502, // Bad Gateway
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Parse API response
    const responseData = await response.json();
    console.log("FixedFloat API response:", JSON.stringify(responseData, null, 2));
    
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
