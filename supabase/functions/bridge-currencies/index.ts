
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// API Configuration from environment variables
const API_KEY = Deno.env.get("FIXED_FLOAT_API_KEY");
const API_SECRET = Deno.env.get("FIXED_FLOAT_API_SECRET");

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('FixedFloat edge function: Fetching currencies');
    
    // Prepare the API request
    const url = "https://ff.io/api/v2/ccies";
    const body = "{}"; // Empty body for currencies endpoint
    
    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = encoder.encode(API_SECRET);
    const message = encoder.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    
    // Convert to hex string
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`Generated signature for API request: ${signatureHex}`);
    
    // Make the request to FixedFloat API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        "X-API-SIGN": signatureHex
      },
      body: body
    });
    
    // Log response status
    console.log(`FixedFloat API response status: ${response.status}`);
    
    // Get the response data
    const data = await response.json();
    
    // Log summarized response data for debugging
    console.log(`FixedFloat API response: code=${data.code}, msg=${data.msg}, currencies count=${data.ccies ? Object.keys(data.ccies).length : 0}`);
    
    // Return the complete response to the client
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in bridge-currencies function:", error);
    
    return new Response(
      JSON.stringify({
        code: -1,
        msg: "Error",
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
