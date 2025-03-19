
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// API Configuration from environment variables
const API_KEY = Deno.env.get("FIXED_FLOAT_API_KEY");
const API_SECRET = Deno.env.get("FIXED_FLOAT_API_SECRET");
const REF_CODE = Deno.env.get("FIXED_FLOAT_REF_CODE") || "tradenly";

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
    console.log('FixedFloat edge function: Calculating price');
    
    // Check if API keys are properly configured
    if (!API_KEY || !API_SECRET) {
      console.error("Missing API keys in environment variables");
      return new Response(
        JSON.stringify({
          code: 500,
          msg: "API configuration error. Missing API keys.",
          error: "Server configuration error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Parse the request body
    const requestData = await req.json();
    const { 
      fromCurrency, 
      toCurrency, 
      amount, 
      orderType = "fixed",
      direction = "from" 
    } = requestData;
    
    console.log(`Request params: ${fromCurrency} -> ${toCurrency}, amount: ${amount}, type: ${orderType}, direction: ${direction}`);
    
    if (!fromCurrency || !toCurrency || !amount) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing required parameters",
          error: "fromCurrency, toCurrency, and amount are required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Set affiliation parameters
    const affTax = orderType === "fixed" ? 1.0 : 0.5;  // 1% for fixed, 0.5% for float
    
    // Prepare the API request body with affiliation parameters
    const apiRequestBody = {
      fromCcy: fromCurrency,
      toCcy: toCurrency,
      amount: parseFloat(amount),
      direction: direction,
      type: orderType,
      refcode: REF_CODE,
      afftax: affTax
    };
    
    const bodyString = JSON.stringify(apiRequestBody);
    
    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = encoder.encode(API_SECRET);
    const message = encoder.encode(bodyString);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    
    // Convert to hex string
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`Generated signature for API request: ${signatureHex}`);
    console.log(`Using refcode: ${REF_CODE} and afftax: ${affTax}`);
    
    // Make the request to FixedFloat API
    const response = await fetch("https://ff.io/api/v2/price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        "X-API-SIGN": signatureHex
      },
      body: bodyString
    });
    
    // Log response status
    console.log(`FixedFloat API response status: ${response.status}`);
    
    // Get the response data
    const data = await response.json();
    
    // Add timestamp and expiry time (120 seconds = 2 minutes)
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 120; // 120 seconds expiration (2 minutes)
    
    // Ensure rate is properly included in response
    if (data.code === 0 && data.data) {
      // If there's no explicit rate field in the response, calculate it
      if (!data.data.rate && data.data.from && data.data.to) {
        const fromAmount = parseFloat(data.data.from.amount);
        const toAmount = parseFloat(data.data.to.amount);
        if (fromAmount > 0 && toAmount > 0) {
          data.data.rate = (toAmount / fromAmount).toString();
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        ...data,
        timestamp,
        expiresAt
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in bridge-price function:", error);
    
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
