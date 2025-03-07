import { supabase } from "@/integrations/supabase/client";

// Base URL for Supabase functions
// Instead of trying to access the protected 'url' property directly,
// we'll construct the URL ourselves based on the Supabase project URL
const SUPABASE_URL = "https://loqpepftcimqjkiinuwv.supabase.co";
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

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

  // Delay between retries in milliseconds (with exponential backoff)
  RETRY_DELAY: 2000, // Base delay before applying exponential backoff
};

// API request wrapper specifically for Supabase functions with timeout, retry logic, and detailed error handling
export async function invokeFunctionWithRetry(
  functionName: string,
  options: any = {}
) {
  const { timeout = API_CONFIG.TIMEOUT, ...invokeOptions } = options;

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
