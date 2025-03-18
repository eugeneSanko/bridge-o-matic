
import { useState, useEffect, useCallback } from "react";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { invokeFunctionWithRetry } from "@/config/api";

interface UseOrderStatusPollingProps {
  orderId: string | null;
  token: string;
  originalOrderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails) => void;
  onTransactionComplete: (details: OrderDetails, apiResponse: any) => void;
}

export const useOrderStatusPolling = ({
  orderId,
  token,
  originalOrderDetails,
  setOrderDetails,
  onTransactionComplete
}: UseOrderStatusPollingProps) => {
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);
  // Since we're removing debuggers, we won't track debug info anymore
  // const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState<any | null>(null);

  const checkOrderStatus = useCallback(
    async (isRetry: boolean = false) => {
      if (!orderId || !token) {
        console.warn("Order ID or token missing, skipping status check.");
        return;
      }

      try {
        console.log(`[${new Date().toLocaleTimeString()}] Checking order status for order ID: ${orderId}`);
        setStatusCheckError(null);

        const apiResponse = await invokeFunctionWithRetry("bridge-status", {
          orderId: orderId,
          token: token,
        });

        console.log("API Response from bridge-status:", apiResponse);

        if (apiResponse && apiResponse.code === 0 && apiResponse.data) {
          const newOrderDetails = {
            ...originalOrderDetails,
            ...apiResponse.data,
            token: token,
            currentStatus: apiResponse.data.status || originalOrderDetails?.currentStatus,
            rawApiResponse: apiResponse,
          };

          setOrderDetails(newOrderDetails);

          // Check if the transaction is completed based on the API response
          if (apiResponse.data.status === "done" || apiResponse.data.status === "completed") {
            onTransactionComplete(newOrderDetails, apiResponse);
          }
        } else {
          const errorMessage = apiResponse?.msg || "Failed to fetch order status";
          console.error("API returned an error:", errorMessage);
          setStatusCheckError(errorMessage);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Error during order status check:", errorMsg);
        setStatusCheckError(errorMsg);
      }
    },
    [orderId, token, originalOrderDetails, setOrderDetails, onTransactionComplete]
  );

  useEffect(() => {
    if (orderId && token) {
      // Initial check when the component mounts
      checkOrderStatus();

      // Set up interval to check order status every 60 seconds
      const intervalId = setInterval(checkOrderStatus, 60000);

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [orderId, token, checkOrderStatus]);

  // Return only the error and the check function since we're removing debuggers
  return { statusCheckError, checkOrderStatus };
};
