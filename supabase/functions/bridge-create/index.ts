
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Validate required environment variables
const API_KEY = Deno.env.get("FIXED_FLOAT_API_KEY") || "lvW17QIF4SzDIzxBLg2oUandukccoZjwhsNGs3GC";
const API_SECRET = Deno.env.get("FIXED_FLOAT_API_SECRET") || "RpPfjnFZx1TfRx6wmYzOgo5Y6QK3OgIETceFZLni";
const REF_CODE = Deno.env.get("FIXED_FLOAT_REF_CODE") || "w15ymdba"; // Get refcode from environment
const API_URL = "https://ff.io/api/v2/create";

// Check if API keys are properly configured
if (!API_KEY || !API_SECRET) {
  console.error("Missing required API keys in environment variables");
}

// Enhanced CORS headers to ensure proper cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, x-client-info, content-type, authorization, X-API-KEY, X-API-SIGN",
  "Access-Control-Max-Age": "86400",
};

// Generate HMAC signature for FixedFloat API using the correct Deno crypto API
async function generateSignature(message: string): Promise<string> {
  // Use native Deno crypto for HMAC
  const encoder = new TextEncoder();
  
  // Verify API_SECRET is defined and has length
  if (!API_SECRET || API_SECRET.length === 0) {
    console.error("API_SECRET is empty or undefined. Cannot generate signature.");
    throw new Error("API secret key is not configured properly");
  }
  
  const keyData = encoder.encode(API_SECRET);
  const messageData = encoder.encode(message);
  
  // Check key length before attempting to create HMAC
  if (keyData.length === 0) {
    console.error("Key data length is zero after encoding");
    throw new Error("API secret key is empty after encoding");
  }
  
  console.log(`Using API secret with length: ${keyData.length}`);
  
  try {
    // Create HMAC using subtle crypto API
    const key = await crypto.subtle.importKey(
      "raw", // format
      keyData, // key data
      { 
        name: "HMAC", 
        hash: "SHA-256" 
      },
      false, // extractable
      ["sign"] // allowed operations
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC", 
      key, 
      messageData
    );
    
    // Convert ArrayBuffer to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.error("Error generating signature:", error);
    throw error;
  }
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
    console.log("Original request body:", JSON.stringify(requestData));
    
    // Create a detailed debug object
    const debugInfo = {
      requestDetails: {
        url: API_URL,
        method: "POST",
        originalRequestBody: requestData,
      },
      signatureInfo: {},
      responseDetails: {},
      curlCommand: "",
      error: null
    };
    
    // First verify that we have the required secrets
    if (!API_KEY || !API_SECRET) {
      console.error("Missing API keys in environment variables. Using fallback values.");
    }
    
    // Add refcode to the request data
    // Important: Create a new object to avoid mutating the original request
    const requestDataWithRefcode = {
      ...requestData,
      refcode: REF_CODE
    };
    
    // Convert to string for signature and request
    const updatedRequestBodyStr = JSON.stringify(requestDataWithRefcode);
    
    console.log("Updated request body with refcode:", updatedRequestBodyStr);
    debugInfo.requestDetails.modifiedRequestBody = requestDataWithRefcode;
    debugInfo.requestDetails.refcode = REF_CODE;
    
    // Generate signature for the exact string we're sending
    try {
      const signature = await generateSignature(updatedRequestBodyStr);
      debugInfo.signatureInfo = {
        signature: signature,
        apiKey: API_KEY,
        signatureGeneratedFor: updatedRequestBodyStr
      };
      
      console.log("Generated signature:", signature);
      console.log("Using API key:", API_KEY);
      
      // Create curl command for debugging
      const curlCommand = `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: ${API_KEY}" \\
  -H "X-API-SIGN: ${signature}" \\ 
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '${updatedRequestBodyStr}' \\ 
  "${API_URL}" -L`;
      
      debugInfo.curlCommand = curlCommand;
      console.log("\nEquivalent curl command:");
      console.log(curlCommand);
      
      // Make request to FixedFloat API
      console.log("Sending request to FixedFloat API...");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "X-API-KEY": API_KEY,
          "X-API-SIGN": signature,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: updatedRequestBodyStr,
      });
      
      // Log response status and headers
      console.log("\nRESPONSE DETAILS:");
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      // Get response body as text first for logging
      const responseText = await response.text();
      console.log("Response body (text):", responseText);
      
      // Record response details
      debugInfo.responseDetails = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      };
      
      // Parse response if it's JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        debugInfo.error = {
          type: "JSON parsing error",
          message: e.message,
          responseText
        };
        
        // Return both the error and debug info
        return new Response(
          JSON.stringify({
            code: 500,
            msg: "Failed to parse response from API",
            error: responseText,
            debugInfo
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
      
      // Make sure we properly pass along any token from the API response
      // Add debug info to the response
      const enrichedResponse = {
        ...responseData,
        debugInfo
      };
      
      // Add special log header to store the response for later use
      const logHeaders = {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Bridge-Create-Logs": "true"
      };
      
      // Return API response to client with debug info
      return new Response(
        JSON.stringify(enrichedResponse),
        {
          status: 200,
          headers: logHeaders,
        }
      );
    } catch (error) {
      console.error("Error generating signature:", error);
      debugInfo.error = {
        type: "Signature Error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
      
      throw error; // Rethrow to be caught by the outer catch block
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Create error response with debug info
    const errorDebugInfo = {
      error: String(error),
      stack: error instanceof Error ? error.stack : null,
      message: error instanceof Error ? error.message : "Unknown error"
    };
    
    return new Response(
      JSON.stringify({
        code: 500,
        msg: error instanceof Error ? error.message : "Internal server error",
        data: null,
        error: String(error),
        debugInfo: errorDebugInfo
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
