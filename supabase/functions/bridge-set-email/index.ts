
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Bridge Set Email Function Loaded");

const FF_API_URL = "https://ff.io/api/v2";
const FF_API_KEY = "lvW17QIF4SzDIzxBLg2oUandukccoZjwhsNGs3GC";
const FF_API_SECRET = "RpPfjnFZx1TfRx6wmYzOgo5Y6QK3OgIETceFZLni";

async function generateSignature(body: any): Promise<string> {
  const encoder = new TextEncoder();
  const bodyStr = JSON.stringify(body);
  const key = encoder.encode(FF_API_SECRET);
  const message = encoder.encode(bodyStr);
  
  // Ensure FF_API_SECRET is not empty
  if (FF_API_SECRET.length === 0) {
    throw new Error("API Secret is empty or undefined");
  }
  
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
    console.log("Processing bridge set email request");
    const requestData = await req.json();
    
    // Extract id, token and email from the request
    const { id, token, email } = requestData;
    
    if (!id || !token || !email) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing order ID, token or email",
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

    console.log(`Setting email notification for order ID: ${id} to: ${email}`);
    
    // Prepare request body for FixedFloat API
    const requestBody = { id, token, email };
    const requestBodyStr = JSON.stringify(requestBody);
    
    console.log("Request body:", requestBodyStr);
    
    // Generate signature
    const signature = await generateSignature(requestBody);
    
    console.log(`Generated signature: ${signature}`);
    
    // Debugging information
    const debugInfo = {
      requestDetails: {
        url: `${FF_API_URL}/setEmail`,
        method: "POST",
        requestBody,
        requestBodyString: requestBodyStr
      },
      signatureInfo: {
        signature,
        apiKey: FF_API_KEY,
        secretLength: FF_API_SECRET.length
      },
      curlCommand: `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: ${FF_API_KEY}" \\
  -H "X-API-SIGN: ${signature}" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '${requestBodyStr}' \\
  "${FF_API_URL}/setEmail" -L`
    };
    
    console.log("Debug Info:", JSON.stringify(debugInfo, null, 2));
    
    // Call the FixedFloat API
    const response = await fetch(`${FF_API_URL}/setEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": FF_API_KEY,
        "X-API-SIGN": signature,
      },
      body: requestBodyStr,
    });
    
    // Get the response body as text
    const responseText = await response.text();
    
    // Update debug info with response details
    debugInfo.responseDetails = {
      status: response.status.toString(),
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    };
    
    if (!response.ok) {
      console.error(`API Error (${response.status}): ${responseText}`);
      
      return new Response(
        JSON.stringify({
          code: response.status,
          msg: `API Error: ${response.statusText}`,
          details: responseText,
          debugInfo
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
    
    // Try to parse the response as JSON
    let apiResponse;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse API response as JSON:", e);
      return new Response(
        JSON.stringify({
          code: 500,
          msg: "Failed to parse API response",
          details: e.message,
          debugInfo
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
    
    console.log("API Response:", JSON.stringify(apiResponse));
    
    // Include debug info in the response
    apiResponse.debugInfo = debugInfo;
    
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
        stack: error.stack
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
