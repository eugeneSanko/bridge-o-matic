
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
    // Get request body
    const requestBody: QrCodeRequest = await req.json();
    console.log("QR code request:", requestBody);

    // Validate request
    if (!requestBody.id || !requestBody.token) {
      return new Response(
        JSON.stringify({
          code: 1,
          msg: "Invalid request parameters",
          error: "Missing required parameters: id or token",
        }),
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
    const apiKey = Deno.env.get("FF_API_KEY");
    const apiSecret = Deno.env.get("FF_API_SECRET");
    
    if (!apiKey || !apiSecret) {
      console.error("Missing API credentials");
      return new Response(
        JSON.stringify({
          code: 1,
          msg: "Configuration error",
          error: "API credentials not configured",
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
    
    // Make request to Fixed Float API
    const ffResponse = await fetch("https://ff.io/api/v2/qr", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!ffResponse.ok) {
      const errorText = await ffResponse.text();
      console.error("Error from Fixed Float API:", errorText);
      
      return new Response(
        JSON.stringify({
          code: 1,
          msg: "Error from Fixed Float API",
          error: errorText,
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
    console.log("Fixed Float API response:", ffData);
    
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
