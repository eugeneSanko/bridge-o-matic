
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Bridge Order Status Function Loaded");

const FF_API_URL = "https://ff.io/api/v2";
const FF_API_KEY = Deno.env.get("FF_API_KEY") || "";
const FF_API_SECRET = Deno.env.get("FF_API_SECRET") || "";

function generateSignature(body: any): string {
  const encoder = new TextEncoder();
  const bodyStr = JSON.stringify(body);
  const key = encoder.encode(FF_API_SECRET);
  const message = encoder.encode(bodyStr);
  
  return crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  ).then((key) => {
    return crypto.subtle.sign("HMAC", key, message);
  }).then((signature) => {
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { id, token } = await req.json();
    
    if (!id || !token) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing order ID or token",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Fetching order status for ID: ${id}`);
    
    // Prepare request body for FixedFloat API
    const requestBody = { id, token };
    
    // Generate signature
    const signature = await generateSignature(requestBody);
    
    console.log(`Generated signature: ${signature}`);
    
    // Call the FixedFloat API
    const response = await fetch(`${FF_API_URL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": FF_API_KEY,
        "X-API-SIGN": signature,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      
      return new Response(
        JSON.stringify({
          code: response.status,
          msg: `API Error: ${response.statusText}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Parse and return the API response
    const apiResponse = await response.json();
    console.log("API Response:", JSON.stringify(apiResponse));
    
    return new Response(
      JSON.stringify(apiResponse),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    
    return new Response(
      JSON.stringify({
        code: 500,
        msg: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
