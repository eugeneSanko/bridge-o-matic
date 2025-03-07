import { supabase } from "@/integrations/supabase/client";
import * as crypto from 'crypto';

// Base URL for Supabase functions
// Instead of trying to access the protected 'url' property directly,
// we'll construct the URL ourselves based on the Supabase project URL
const SUPABASE_URL = "https://loqpepftcimqjkiinuwv.supabase.co";
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// FixedFloat API credentials
const FF_API_KEY = "bzplvDU0N2Pa5crmQTbqteew6WJyuSGX9BEBPclU";
const FF_API_SECRET = "qIk7Vd6b5M3wqOmD3cnqRGQ6k3dGTDss47fvdng4";

export const API_CONFIG = {
  // Edge function endpoints
  FF_CURRENCIES: "ff-currencies",
  FF_PRICE: "ff-price",
  FF_ORDER: "ff-order",
  FF_STATUS: "ff-status",
  FF_TEST: "ff-test",
  BRIDGE_ORDER: "bridge-order",

  // Default timeout in milliseconds
  TIMEOUT: 60000, // Increased from 45000 to give more time for API responses

  // Number of retries for failed requests
  MAX_RETRIES: 5, // Increased from 3 to 5 for more resilience

  // RETRY_DELAY: 2000, // Base delay before applying exponential backoff
  RETRY_DELAY: 2000, // Base delay before applying exponential backoff
  
  // FixedFloat API credentials (for frontend reference only)
  FF_API_KEY,
  FF_API_SECRET,
  
  // Direct API URL (only for testing or when edge functions are not available)
  FF_DIRECT_API_URL: "https://ff.io/api/v2"
};

/**
 * Generates a FixedFloat API signature for the given request body
 * @param body The request body as a JavaScript object
 * @returns The HMAC-SHA256 signature of the stringified body
 */
export function generateFixedFloatSignature(body: any): string {
  // Convert body to string - if empty, use '{}' as that's what the API expects
  const bodyStr = body ? JSON.stringify(body) : '{}';
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', FF_API_SECRET);
  hmac.update(bodyStr);
  
  // Return the signature as a hex string
  return hmac.digest('hex');
}

// API request wrapper specifically for Supabase functions with timeout, retry logic, and detailed error handling
export async function invokeFunctionWithRetry(
  functionName: string,
  options: any = {}
) {
  const { timeout = API_CONFIG.TIMEOUT, ...invokeOptions } = options;
  
  // If this is a FixedFloat API request, append the needed headers
  if (functionName.startsWith('ff-')) {
    // Ensure we have a body object
    const body = options.body || {};
    
    // Generate the API signature
    const signature = generateFixedFloatSignature(body);
    
    // Add FixedFloat API headers to the request
    invokeOptions.headers = {
      ...invokeOptions.headers,
      'X-API-KEY': FF_API_KEY,
      'X-API-SIGN': signature
    };
    
    console.log(`Prepared FixedFloat API request for ${functionName} with signature: ${signature}`);
  }

  let lastError: Error | null = null;

  for (let i = 0; i < API_CONFIG.MAX_RETRIES; i++) {
    try {
      console.log(`API attempt ${i + 1} for ${functionName}`);

      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`Request timeout for ${functionName} after ${timeout}ms`);
      }, timeout);

      // Use Supabase's built-in functions.invoke method
      const { data, error } = await supabase.functions.invoke(functionName, {
        ...invokeOptions,
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // If the function errors out with a 500 or other error, check the error
      if (error) {
        console.error(
          `Function error! status: ${error.status}, message: ${error.message}`
        );
        console.error(`Error details:`, error);

        // Handle Fixed Float API specific errors
        if (error.message && error.message.includes("Fixed Float API")) {
          // If it's an API connectivity issue, we might want to retry
          throw new Error(`Fixed Float API error: ${error.message}`);
        }

        throw new Error(`Function error! ${error.message}`);
      }

      // Log the success response
      console.log(`Successfully invoked ${functionName}, response:`, data);

      // Check for API-specific errors in the response
      if (data && data.code && data.code !== 0) {
        console.error(`API error! code: ${data.code}, message: ${data.msg}`);
        console.error(`Error details:`, data.error || {});
        throw new Error(`API error! ${data.msg}`);
      }

      return data;
    } catch (error) {
      const retryableErrors = [
        "AbortError",
        "timeout",
        "network error",
        "failed to fetch",
        "network request failed",
        "edge function returned a non-2xx status code",
        "connection reset",
        "connection refused",
        "fixed float api error",
      ];

      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      const isRetryable = retryableErrors.some((msg) =>
        errorMessage.includes(msg.toLowerCase())
      );

      console.error(`Attempt ${i + 1} failed for ${functionName}:`, error);
      console.error(`Error message: ${errorMessage}`);
      lastError = error as Error;

      // If we should not retry this particular error, break immediately
      if (!isRetryable) {
        console.log(`Error not retryable: ${errorMessage}`);
        break;
      }

      // Don't delay on the last attempt
      if (i < API_CONFIG.MAX_RETRIES - 1) {
        // Exponential backoff with jitter
        const delay =
          API_CONFIG.RETRY_DELAY * Math.pow(2, i) * (0.5 + Math.random() * 0.5);
        console.log(`Retrying ${functionName} in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw (
    lastError ||
    new Error(`Request to ${functionName} failed after all retries`)
  );
}

// Legacy fetch with timeout function (keep this for non-Supabase function calls)
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_CONFIG.TIMEOUT
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));

  return response;
}

// Legacy retry logic for fetch (keep this for non-Supabase function calls)
export async function fetchWithRetry(url: string, options: RequestInit = {}) {
  let lastError: Error | null = null;

  for (let i = 0; i < API_CONFIG.MAX_RETRIES; i++) {
    try {
      console.log(`API attempt ${i + 1} for ${url}`);
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, response: ${errorText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error as Error;

      // Don't delay on the last attempt
      if (i < API_CONFIG.MAX_RETRIES - 1) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Request failed after all retries");
}
