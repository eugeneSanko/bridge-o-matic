
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// API Configuration from environment variables
const API_KEY = Deno.env.get("FIXED_FLOAT_API_KEY") || "lvW17QIF4SzDIzxBLg2oUandukccoZjwhsNGs3GC";
const API_SECRET = Deno.env.get("FIXED_FLOAT_API_SECRET") || "RpPfjnFZx1TfRx6wmYzOgo5Y6QK3OgIETceFZLni";

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
    const rawData = await response.json();
    
    // Transform the data structure for our frontend
    if (rawData && rawData.code === 0 && rawData.ccies) {
      console.log("Converting FixedFloat response to our format");
      
      // Create a formatted data array from the currencies object
      const formattedData = Object.values(rawData.ccies).map((currency: any) => ({
        code: currency.code || "",
        coin: currency.coin || "",
        network: currency.network || "",
        priority: currency.priority || 0,
        name: currency.name || "",
        recv: currency.recv || 0,
        send: currency.send || 0,
        tag: currency.tag,
        logo: currency.logo || null,
        color: currency.color || "#ffffff"
      }));
      
      return new Response(JSON.stringify({
        code: 0,
        msg: "OK",
        data: formattedData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // If raw data doesn't have the expected structure, pass it through
    return new Response(JSON.stringify(rawData), {
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
