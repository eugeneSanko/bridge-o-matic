
/**
 * Utility functions for working with URLs in the application
 */

// Base URL for the application - use the environment variable if available, or fall back to a default
const BASE_URL = import.meta.env.VITE_APP_URL || "https://bridge.tradenly.xyz";

/**
 * Generates a URL for viewing a transaction's status
 * @param orderId The order ID
 * @param token The authentication token
 * @returns A fully-qualified URL for the transaction status page
 */
export const generateTransactionStatusUrl = (orderId: string, token: string): string => {
  return `${BASE_URL}/bridge/awaiting-deposit?orderId=${orderId}&token=${token}`;
};

/**
 * Generates a URL for viewing a completed transaction
 * @param orderId The order ID
 * @returns A fully-qualified URL for the completed transaction page
 */
export const generateCompletedTransactionUrl = (orderId: string): string => {
  return `${BASE_URL}/bridge/complete?orderId=${orderId}`;
};

/**
 * Generates a receipt URL
 * @param orderId The order ID
 * @returns A fully-qualified URL for the transaction receipt
 */
export const generateReceiptUrl = (orderId: string): string => {
  return `${BASE_URL}/bridge/receipt?orderId=${orderId}`;
};

/**
 * Checks if a URL is an internal URL (i.e., from our domain)
 * @param url The URL to check
 * @returns True if the URL is internal, false otherwise
 */
export const isInternalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(BASE_URL);
    return urlObj.hostname === baseUrlObj.hostname;
  } catch (e) {
    return false;
  }
};
