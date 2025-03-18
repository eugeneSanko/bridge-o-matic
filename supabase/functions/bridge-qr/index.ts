
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface QrCodeRequest {
  id: string;
  token: string;
  choice: string;
}

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
    // Log request details
    console.log("QR code request URL:", req.url);
    console.log("QR code request method:", req.method);
    console.log("QR code request headers:", Object.fromEntries(req.headers.entries()));
    
    // Get request body
    const requestBody: QrCodeRequest = await req.json();
    console.log("QR code request body:", JSON.stringify(requestBody, null, 2));

    // Validate request
    if (!requestBody.id || !requestBody.token) {
      const errorResponse = {
        code: 1,
        msg: "Invalid request parameters",
        error: "Missing required parameters: id or token",
      };
      console.error("QR code validation error:", errorResponse);
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Create a headers object for the Fixed Float API request
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json; charset=UTF-8");
    
    // Get API key and secret from environment variables
    const apiKey = Deno.env.get("FIXED_FLOAT_API_KEY") || "lvW17QIF4SzDIzxBLg2oUandukccoZjwhsNGs3GC";
    const apiSecret = Deno.env.get("FIXED_FLOAT_API_SECRET") || "RpPfjnFZx1TfRx6wmYzOgo5Y6QK3OgIETceFZLni";
    
    console.log("API Key exists:", !!apiKey);
    console.log("API Secret exists:", !!apiSecret);
    console.log("Available env vars:", Object.keys(Deno.env.toObject()).filter(key => !key.includes("SECRET")).join(", "));
    
    if (!apiKey || !apiSecret) {
      console.error("Missing API credentials");
      
      // Return detailed error for debugging
      const debugInfo = {
        apiKeyStatus: apiKey ? "present" : "missing",
        apiSecretStatus: apiSecret ? "present" : "missing",
        envVars: Object.keys(Deno.env.toObject()).filter(key => !key.includes("SECRET")).join(", ")
      };
      
      return new Response(
        JSON.stringify({
          code: 1,
          msg: "Configuration error",
          error: "API credentials not configured",
          debugInfo
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }
    
    // Set API key header
    headers.set("X-API-KEY", apiKey);
    
    // Generate HMAC signature
    const encoder = new TextEncoder();
    const key = encoder.encode(apiSecret);
    const message = encoder.encode(JSON.stringify(requestBody));
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    
    // Convert signature to hex string
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Set signature header
    headers.set("X-API-SIGN", signatureHex);
    
    console.log("Making request to Fixed Float API...");
    console.log("Request headers:", Object.fromEntries(headers.entries()));
    console.log("Request body:", JSON.stringify(requestBody));
    
    // Equivalent curl command (masked for security)
    const maskedApiKey = apiKey.substring(0, 3) + "..." + apiKey.substring(apiKey.length - 3);
    const curlCommand = `curl -X POST "https://ff.io/api/v2/qr" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: ${maskedApiKey}" \\
  -H "X-API-SIGN: ${signatureHex}" \\
  -d '${JSON.stringify(requestBody)}'`;
    
    console.log("Equivalent curl command:", curlCommand);
    
    // Make request to Fixed Float API
    const ffResponse = await fetch("https://ff.io/api/v2/qr", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    
    // Log response status
    console.log("Fixed Float API response status:", ffResponse.status, ffResponse.statusText);
    console.log("Fixed Float API response headers:", Object.fromEntries(ffResponse.headers.entries()));
    
    if (!ffResponse.ok) {
      const errorText = await ffResponse.text();
      console.error("Error from Fixed Float API:", errorText);
      
      return new Response(
        JSON.stringify({
          code: 1,
          msg: "Error from Fixed Float API",
          error: errorText,
          debugInfo: {
            status: ffResponse.status,
            statusText: ffResponse.statusText,
            headers: Object.fromEntries(ffResponse.headers.entries())
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }
    
    // Parse response
    const ffData = await ffResponse.json();
    console.log("Fixed Float API response:", JSON.stringify(ffData, null, 2));
    
    // Return response with CORS headers
    return new Response(JSON.stringify(ffData), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        code: 1,
        msg: "Error processing request",
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
