
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OrderDetails } from "@/hooks/useBridgeOrder";

// Polling intervals in milliseconds for different order statuses
const POLLING_INTERVALS = {
  DEFAULT: 15000, // Default: 15 seconds
  NEW: 10000, // Awaiting deposit: 10 seconds
  PENDING: 10000, // Received, waiting for confirmations: 10 seconds
  EXCHANGE: 20000, // Exchange in progress: 20 seconds
  WITHDRAW: 20000, // Sending funds: 20 seconds
  DONE: 30000, // Completed: continue polling but less frequently
  EXPIRED: 15000, // Changed from null to 15000 to enable polling
  EMERGENCY: 15000, // Changed from null to 15000 to enable polling
};

interface UseOrderStatusPollingProps {
  orderId: string | null;
  token: string;
  originalOrderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails) => void;
  onTransactionComplete: (details: OrderDetails, apiResponse: any) => void;
  setStatusCheckDebugInfo?: (info: any) => void;
}

export const useOrderStatusPolling = ({
  orderId,
  token,
  originalOrderDetails,
  setOrderDetails,
  onTransactionComplete,
  setStatusCheckDebugInfo,
}: UseOrderStatusPollingProps) => {
  const [statusCheckDebugInfoInternal, setStatusCheckDebugInfoInternal] =
    useState<any>(null);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  const [lastPollTimestamp, setLastPollTimestamp] = useState(0);
  const [manualStatusCheckAttempted, setManualStatusCheckAttempted] =
    useState(false);
  const [emergencyActionTaken, setEmergencyActionTaken] = useState(false);

  // Function to update debug info in both places
  const updateDebugInfo = (info: any) => {
    setStatusCheckDebugInfoInternal(info);
    if (setStatusCheckDebugInfo) {
      setStatusCheckDebugInfo(info);
    }
  };

  // Update polling interval based on order status
  useEffect(() => {
    if (!originalOrderDetails || !originalOrderDetails.rawApiResponse) return;

    const apiStatus = originalOrderDetails.rawApiResponse.status;
    
    // If emergency action has been taken, always use polling regardless of status
    if (emergencyActionTaken && (apiStatus === 'EMERGENCY' || apiStatus === 'EXPIRED')) {
      console.log(`Emergency action was taken. Enabling polling for ${apiStatus} status`);
      setPollingInterval(POLLING_INTERVALS.DEFAULT);
      return;
    }
    
    const newInterval =
      POLLING_INTERVALS[apiStatus] ?? POLLING_INTERVALS.DEFAULT;

    console.log(
      `Setting polling interval to ${
        newInterval === null ? "none" : `${newInterval}ms`
      } for status ${apiStatus}`
    );
    setPollingInterval(newInterval);
  }, [originalOrderDetails?.rawApiResponse?.status, emergencyActionTaken]);

  // Function to check order status manually or via polling
  const checkOrderStatus = useCallback(
    async (force = false) => {
      if (!orderId || !token) {
        console.error("Missing order ID or token for status check");
        setStatusCheckError("Missing order ID or token");
        return;
      }

      // Always check if force is true or if emergencyActionTaken is true
      if (pollingInterval === null && !force && !emergencyActionTaken) {
        console.log("Polling disabled for current status, skipping check");
        return;
      }

      const now = Date.now();
      if (!force && now - lastPollTimestamp < pollingInterval) {
        console.log(
          `Not enough time elapsed since last poll (${
            (now - lastPollTimestamp) / 1000
          }s), skipping`
        );
        return;
      }

      setLastPollTimestamp(now);

      try {
        console.log(
          `${
            force ? "Forcing" : "Scheduled"
          } order status check with bridge-status function`
        );
        setManualStatusCheckAttempted(true);

        // When an emergency action is taken, mark it
        if (force && (originalOrderDetails?.rawApiResponse?.status === 'EMERGENCY' || 
                      originalOrderDetails?.rawApiResponse?.status === 'EXPIRED')) {
          console.log("Setting emergencyActionTaken flag to true");
          setEmergencyActionTaken(true);
        }

        const { data, error } = await supabase.functions.invoke(
          "bridge-status",
          {
            body: { id: orderId, token },
          }
        );

        if (error) {
          console.error("Error calling bridge-status function:", error);
          setStatusCheckError(`Error: ${error.message}`);
          updateDebugInfo({ error });
          return;
        }

        console.log("Status check response:", data);

        if (data.debugInfo) {
          updateDebugInfo(data.debugInfo);
        }

        if (data.code === a && data.data) {
          const status = data.data.status;
          console.log(`Order status from API: ${status}`);

          if (status === "DONE" && originalOrderDetails) {
            console.log("Order is complete, showing notification");
            toast({
              title: "Transaction Complete",
              description: `Your transaction has been completed successfully.`,
              variant: "default",
            });

            // Update order details with completed status
            const updatedDetails = {
              ...originalOrderDetails,
              currentStatus: "completed",
              rawApiResponse: {
                ...data.data,
              },
            };

            setOrderDetails(updatedDetails);

            // Call the completion handler with the full API response
            onTransactionComplete(updatedDetails, data);
          }
        } else {
          console.error("API returned an error:", data);
          setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error checking order status:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setStatusCheckError(`Error: ${errorMessage}`);
      }
    },
    [
      orderId,
      token,
      pollingInterval,
      lastPollTimestamp,
      originalOrderDetails,
      setOrderDetails,
      onTransactionComplete,
      updateDebugInfo,
      emergencyActionTaken,
    ]
  );

  // Set up initial status check and polling
  useEffect(() => {
    if (orderId && token && !manualStatusCheckAttempted) {
      checkOrderStatus(true);
    }
  }, [orderId, token, manualStatusCheckAttempted, checkOrderStatus]);

  useEffect(() => {
    if (!orderId || !token || pollingInterval === null) return;

    console.log(`Setting up polling with ${pollingInterval}ms interval`);

    const intervalId = setInterval(() => {
      checkOrderStatus();
    }, pollingInterval);

    return () => {
      console.log('Clearing polling interval');
      clearInterval(intervalId);
    };
  }, [orderId, token, pollingInterval, checkOrderStatus]);

  return {
    statusCheckDebugInfo: statusCheckDebugInfoInternal,
    statusCheckError,
    checkOrderStatus,
  };
};
