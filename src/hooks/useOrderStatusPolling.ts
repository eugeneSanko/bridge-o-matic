
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { logger } from "@/utils/logger";

// Create a dedicated logger for this hook
const pollingLogger = logger;

// Reduced polling intervals in milliseconds for different order statuses
const POLLING_INTERVALS = {
  DEFAULT: 8000,  // Default: 8 seconds (reduced from 15s)
  NEW: 5000,      // Awaiting deposit: 5 seconds (reduced from 10s)
  PENDING: 5000,  // Received, waiting for confirmations: 5 seconds (reduced from 10s)
  EXCHANGE: 8000, // Exchange in progress: 8 seconds (reduced from 20s)
  WITHDRAW: 8000, // Sending funds: 8 seconds (reduced from 20s)
  DONE: 15000,    // Completed: 15 seconds (reduced from 30s)
  EXPIRED: 8000,  // Expired: 8 seconds (reduced from 15s)
  EMERGENCY: 8000, // Emergency: 8 seconds (reduced from 15s)
};

interface UseOrderStatusPollingProps {
  orderId: string | null;
  token: string;
  originalOrderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails) => void;
  onTransactionComplete: (details: OrderDetails, apiResponse: any) => void;
  setStatusCheckDebugInfo?: (info: any) => void;
  onDatabaseCheckStart?: () => void;
  onDatabaseCheckComplete?: () => void;
}

export const useOrderStatusPolling = ({
  orderId,
  token,
  originalOrderDetails,
  setOrderDetails,
  onTransactionComplete,
  setStatusCheckDebugInfo,
  onDatabaseCheckStart,
  onDatabaseCheckComplete,
}: UseOrderStatusPollingProps) => {
  const [statusCheckDebugInfoInternal, setStatusCheckDebugInfoInternal] =
    useState<any>(null);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  const [lastPollTimestamp, setLastPollTimestamp] = useState(0);
  const [manualStatusCheckAttempted, setManualStatusCheckAttempted] =
    useState(false);
  const [emergencyActionTaken, setEmergencyActionTaken] = useState(false);
  const dbCheckInProgressRef = useRef(false);
  const lastCheckedStatusRef = useRef<string | null>(null);

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
      pollingLogger.info(`Emergency action was taken. Enabling polling for ${apiStatus} status`);
      setPollingInterval(POLLING_INTERVALS.DEFAULT);
      return;
    }
    
    const newInterval =
      POLLING_INTERVALS[apiStatus] ?? POLLING_INTERVALS.DEFAULT;

    pollingLogger.debug(
      `Setting polling interval to ${
        newInterval === null ? "none" : `${newInterval}ms`
      } for status ${apiStatus}`
    );
    setPollingInterval(newInterval);
  }, [originalOrderDetails?.rawApiResponse?.status, emergencyActionTaken]);

  // Function to check the database for completed transactions - with improved timeout
  const checkDbForCompletedTransaction = useCallback(async (orderId: string) => {
    if (dbCheckInProgressRef.current) {
      pollingLogger.debug("Database check already in progress, skipping");
      return null;
    }

    if (onDatabaseCheckStart) {
      onDatabaseCheckStart();
    }
    
    dbCheckInProgressRef.current = true;
    pollingLogger.info("Checking database for completed transaction:", orderId);
    
    try {
      // Use a shorter timeout to ensure the check doesn't hang indefinitely (reduced from 8s to 3s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database check timed out")), 3000);
      });
      
      const dbCheckPromise = supabase
        .from('bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderId)
        .limit(1);
      
      // Race the database query against the timeout
      const { data: results, error } = await Promise.race([
        dbCheckPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        pollingLogger.error("Error checking database:", error);
        return null;
      }
      
      if (results && results.length > 0) {
        pollingLogger.info("Found transaction in database:", results[0]);
        return results[0];
      }
      
      return null;
    } catch (error) {
      pollingLogger.error("Exception during database check:", error);
      return null;
    } finally {
      dbCheckInProgressRef.current = false;
      if (onDatabaseCheckComplete) {
        onDatabaseCheckComplete();
      }
    }
  }, [onDatabaseCheckStart, onDatabaseCheckComplete]);

  // Function to check order status manually or via polling - with anti-flicker protection
  const checkOrderStatus = useCallback(
    async (force = false) => {
      if (!orderId || !token) {
        pollingLogger.error("Missing order ID or token for status check");
        setStatusCheckError("Missing order ID or token");
        return;
      }

      // Always check if force is true or if emergencyActionTaken is true
      if (pollingInterval === null && !force && !emergencyActionTaken) {
        pollingLogger.debug("Polling disabled for current status, skipping check");
        return;
      }

      const now = Date.now();
      if (!force && now - lastPollTimestamp < pollingInterval) {
        pollingLogger.debug(
          `Not enough time elapsed since last poll (${
            (now - lastPollTimestamp) / 1000
          }s), skipping`
        );
        return;
      }

      setLastPollTimestamp(now);

      // Check database for EXPIRED status first to improve performance
      if (originalOrderDetails?.rawApiResponse?.status === 'EXPIRED') {
        pollingLogger.info("Order is EXPIRED, checking database for completed transaction first");
        const dbTransaction = await checkDbForCompletedTransaction(orderId);
        
        if (dbTransaction) {
          pollingLogger.info("Found completed transaction in database for expired order");
          
          // Create updated order details with data from the database
          const updatedDetails: OrderDetails = {
            ...originalOrderDetails,
            currentStatus: "completed",
            rawApiResponse: dbTransaction.raw_api_response || originalOrderDetails.rawApiResponse
          };
          
          setOrderDetails(updatedDetails);
          return;
        } else {
          pollingLogger.info("No completed transaction found in database, continuing with API check");
        }
      }

      try {
        pollingLogger.info(
          `${
            force ? "Forcing" : "Scheduled"
          } order status check with bridge-status function`
        );
        setManualStatusCheckAttempted(true);

        // When an emergency action is taken, mark it
        if (force && (originalOrderDetails?.rawApiResponse?.status === 'EMERGENCY' || 
                      originalOrderDetails?.rawApiResponse?.status === 'EXPIRED')) {
          pollingLogger.info("Setting emergencyActionTaken flag to true");
          setEmergencyActionTaken(true);
        }

        const { data, error } = await supabase.functions.invoke(
          "bridge-status",
          {
            body: { id: orderId, token },
          }
        );

        if (error) {
          pollingLogger.error("Error calling bridge-status function:", error);
          setStatusCheckError(`Error: ${error.message}`);
          updateDebugInfo({ error });
          return;
        }

        pollingLogger.debug("Status check response:", data);

        if (data.debugInfo) {
          updateDebugInfo(data.debugInfo);
        }

        if (data.code === 0 && data.data) {
          const status = data.data.status;
          
          // Avoid flicker by checking if status has meaningfully changed
          const statusChanged = lastCheckedStatusRef.current !== status;
          lastCheckedStatusRef.current = status;
          
          pollingLogger.info(`Order status from API: ${status}, changed: ${statusChanged}`);

          if (status === "DONE" && originalOrderDetails && statusChanged) {
            pollingLogger.info("Order is complete, showing notification");
            
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
          } else if (statusChanged) {
            // Only update if status actually changed to prevent flicker
            if (originalOrderDetails) {
              const updatedDetails = {
                ...originalOrderDetails,
                rawApiResponse: {
                  ...data.data,
                },
              };
              setOrderDetails(updatedDetails);
            }
          }
        } else {
          pollingLogger.error("API returned an error:", data);
          setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
        }
      } catch (error) {
        pollingLogger.error("Error checking order status:", error);
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
      checkDbForCompletedTransaction
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

    pollingLogger.debug(`Setting up polling with ${pollingInterval}ms interval`);

    const intervalId = setInterval(() => {
      checkOrderStatus();
    }, pollingInterval);

    return () => {
      pollingLogger.debug('Clearing polling interval');
      clearInterval(intervalId);
    };
  }, [orderId, token, pollingInterval, checkOrderStatus]);

  return {
    statusCheckDebugInfo: statusCheckDebugInfoInternal,
    statusCheckError,
    checkOrderStatus,
    checkDbForCompletedTransaction,
  };
};
