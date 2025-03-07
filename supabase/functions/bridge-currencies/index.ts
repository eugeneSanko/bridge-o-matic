
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
    const apiData = await response.json();
    
    // Transform the response format to a more usable structure
    let transformedData = {
      code: apiData.code,
      msg: apiData.msg,
      data: [] as any[]
    };
    
    // If we have currencies data, transform it from object to array
    if (apiData.code === 0 && apiData.ccies) {
      transformedData.data = Object.entries(apiData.ccies).map(([code, details]: [string, any]) => ({
        code,
        coin: details.coin || code.split(/(?=[A-Z])/)[0], // Extract coin from code if not provided
        network: details.network || null,
        priority: details.priority || 0,
        name: details.name || code,
        recv: details.recv !== false ? 1 : 0,
        send: details.send !== false ? 1 : 0,
        tag: details.tag || null,
        logo: details.image || null,
        color: details.color || "#ffffff"
      }));
    }
    
    console.log(`Transformed ${transformedData.data.length} currencies for client`);
    
    // Return the transformed response to the client
    return new Response(JSON.stringify(transformedData), {
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
