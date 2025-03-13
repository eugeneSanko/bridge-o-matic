
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBridgeOrder } from "@/hooks/useBridgeOrder";
import { useDeepLink } from "@/hooks/useDeepLink";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DebugPanel } from "@/components/bridge/DebugPanel";
import { DebugControls, BridgeStatus } from "@/components/bridge/DebugControls";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiOrderResponse } from "@/types/bridge";

const REFRESHABLE_STATUSES = ["NEW", "PENDING", "EXCHANGE", "WITHDRAW", "EMERGENCY"];

const BridgeAwaitingDeposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";

  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [statusCheckError, setStatusCheckError] = useState(null);
  const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [statusChanged, setStatusChanged] = useState(false);

  const {
    orderDetails: originalOrderDetails,
    loading,
    error,
    handleCopyAddress,
  } = useBridgeOrder(orderId, true, true);

  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  const { deepLink, addLog } = useDeepLink();
  const intervalRef = useRef(null);
  const lastKnownStatusRef = useRef("");
  const completionProcessedRef = useRef(false);

  // Log changes to help debug status issues
  useEffect(() => {
    console.log("Original Order Details updated:", originalOrderDetails);
    
    // When originalOrderDetails update, synchronize with local state immediately
    if (originalOrderDetails) {
      const apiStatus = originalOrderDetails.rawApiResponse?.status;
      console.log("API Status from original order details:", apiStatus);
      
      if (apiStatus && apiStatus !== lastKnownStatusRef.current) {
        console.log(`Status change detected in original details: ${lastKnownStatusRef.current} -> ${apiStatus}`);
        lastKnownStatusRef.current = apiStatus;
        setStatusChanged(true);
        
        // If status is DONE and not yet processed, handle completion
        if (apiStatus === "DONE" && !completionProcessedRef.current) {
          console.log("DONE status detected - handling completion");
          completionProcessedRef.current = true;
          handleOrderCompletion();
        }
      }
      
      // Update local state with original details
      setOrderDetails(originalOrderDetails);
    }
  }, [originalOrderDetails]);

  useEffect(() => {
    console.log("Order Details state updated:", orderDetails);
  }, [orderDetails]);

  useEffect(() => {
    if (!originalOrderDetails) return;

    if (simulateSuccess) {
      setOrderDetails({
        ...originalOrderDetails,
        currentStatus: "DONE",
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE",
        },
      });
      
      if (!completionProcessedRef.current) {
        completionProcessedRef.current = true;
        handleOrderCompletion();
      }
    } else {
      setOrderDetails(originalOrderDetails);
      
      if (originalOrderDetails?.rawApiResponse?.status) {
        const newStatus = originalOrderDetails.rawApiResponse.status;
        if (lastKnownStatusRef.current !== newStatus) {
          console.log(`Status changed from ${lastKnownStatusRef.current} to ${newStatus}`);
          lastKnownStatusRef.current = newStatus;
          setStatusChanged(true);
          
          if (newStatus === "DONE" && !completionProcessedRef.current) {
            completionProcessedRef.current = true;
            handleOrderCompletion();
          }
        }
      }
    }
  }, [originalOrderDetails, simulateSuccess]);

  const handleStatusChange = (newStatus: BridgeStatus, mockApiResponse: ApiOrderResponse['data']) => {
    console.log(`Setting debug status to: ${newStatus}`, mockApiResponse);
    
    if (!orderDetails) {
      toast({
        title: "Cannot change status",
        description: "No order details loaded yet",
        variant: "destructive",
      });
      return;
    }
    
    const updatedOrderDetails = {
      ...orderDetails,
      currentStatus: newStatus,
      rawApiResponse: {
        ...orderDetails.rawApiResponse,
        ...mockApiResponse,
        status: newStatus,
      },
    };
    
    setOrderDetails(updatedOrderDetails);
    
    if (lastKnownStatusRef.current !== newStatus) {
      console.log(`Status changed from ${lastKnownStatusRef.current} to ${newStatus}`);
      lastKnownStatusRef.current = newStatus;
      setStatusChanged(true);
      
      toast({
        title: `Status Updated: ${newStatus}`,
        description: `Simulating bridge status: ${newStatus}`,
      });
      
      if (newStatus === "DONE" && !completionProcessedRef.current) {
        completionProcessedRef.current = true;
        handleOrderCompletion();
      } else if (REFRESHABLE_STATUSES.includes(newStatus)) {
        setTransactionSaved(false);
        setIsPollingActive(true);
        completionProcessedRef.current = false;
      } else {
        setIsPollingActive(false);
      }
    }
    
    setPollCount(prev => prev + 1);
  };

  const handleOrderCompletion = () => {
    console.log("Handling order completion");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsPollingActive(false);
    setTransactionSaved(true);
    
    setPollCount(prev => prev + 1);
    
    toast({
      title: "Transaction Complete",
      description: `Your transaction has been completed successfully.`,
      variant: "default",
    });
  };

  const checkOrderStatus = async () => {
    if (!orderId || !token) {
      console.error("Missing order ID or token for status check");
      setStatusCheckError("Missing order ID or token");
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] Checking order status for ${orderId}`);
      
      const { data, error } = await supabase.functions.invoke("bridge-status", {
        body: { id: orderId, token },
      });

      if (error) {
        console.error("Error calling bridge-status function:", error);
        setStatusCheckError(`Error: ${error.message}`);
        setStatusCheckDebugInfo({ error });
        return;
      }

      if (data.debugInfo) {
        setStatusCheckDebugInfo(data.debugInfo);
      }

      if (data.code === 0 && data.data) {
        const status = data.data.status;
        const previousStatus = lastKnownStatusRef.current;
        console.log(`Order ${orderId} status update: ${status} (previous: ${previousStatus})`);

        const hasStatusChanged = previousStatus !== status;
        
        if (hasStatusChanged) {
          console.log(`Status changed from ${previousStatus} to ${status}`);
          setStatusChanged(true);
          
          lastKnownStatusRef.current = status;
          
          setOrderDetails((prevDetails) => {
            if (!prevDetails) return null;
            
            return {
              ...prevDetails,
              currentStatus: status,
              rawApiResponse: data.data,
            };
          });
          
          setPollCount(prev => prev + 1);
          
          if (status === "DONE" && !completionProcessedRef.current) {
            completionProcessedRef.current = true;
            handleOrderCompletion();
          } else if (!REFRESHABLE_STATUSES.includes(status)) {
            console.log(`Status ${status} is not refreshable, stopping polling`);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsPollingActive(false);
          }
        } else {
          setOrderDetails((prevDetails) => {
            if (!prevDetails) return null;
            return {
              ...prevDetails,
              rawApiResponse: data.data,
            };
          });
        }
      } else {
        setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setStatusCheckError(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "No order information found",
        variant: "destructive",
      });
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId && token) {
      console.log("Initial status check on component mount");
      checkOrderStatus();
    }
  }, [orderId, token]);

  useEffect(() => {
    if (statusChanged) {
      const timer = setTimeout(() => {
        setStatusChanged(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [statusChanged]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPollingActive || !orderDetails || transactionSaved) {
      console.log("Polling is disabled or not needed");
      return;
    }

    const currentStatus = orderDetails.rawApiResponse?.status;
    
    if (currentStatus && REFRESHABLE_STATUSES.includes(currentStatus)) {
      console.log(`Setting up polling interval for status ${currentStatus}`);
      
      intervalRef.current = setInterval(() => {
        console.log("Polling interval triggered");
        checkOrderStatus();
      }, 15000);
    } else {
      console.log(`Status ${currentStatus} is not refreshable, not setting up polling`);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPollingActive, orderDetails?.rawApiResponse?.status, transactionSaved, orderId, token]);

  const forceRefresh = () => {
    setPollCount(prev => prev + 1);
    checkOrderStatus();
    
    toast({
      title: "Refreshing Status",
      description: "Checking for the latest transaction status...",
    });
  };

  return (
    <>
      <DebugControls 
        onStatusChange={handleStatusChange}
        currentStatus={orderDetails?.rawApiResponse?.status || "N/A"}
      />

      <div className="fixed top-4 right-4 z-50 bg-black/80 p-3 rounded-lg flex items-center gap-3">
        <Switch
          id="simulate-success"
          checked={simulateSuccess}
          onCheckedChange={setSimulateSuccess}
        />
        <Label htmlFor="simulate-success" className="text-sm text-white">
          Simulate Completed
        </Label>
      </div>

      <Button onClick={forceRefresh} className="my-4">
        Refresh Status
      </Button>

      <div className="mb-4 p-2 bg-black/50 text-xs rounded">
        <p>Current API Status: {orderDetails?.rawApiResponse?.status || "N/A"}</p>
        <p>Polling Active: {isPollingActive ? "Yes" : "No"}</p>
        <p>Poll Count: {pollCount}</p>
        <p>Last Known Status: {lastKnownStatusRef.current || "None"}</p>
        <p>Status Changed: {statusChanged ? "Yes" : "No"}</p>
        <p>Completion Processed: {completionProcessedRef.current ? "Yes" : "No"}</p>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {!orderDetails && <EmptyState />}

      {orderDetails && (
        <BridgeTransaction
          orderDetails={orderDetails}
          onCopyAddress={handleCopyAddress}
          key={`transaction-${orderDetails.rawApiResponse?.status || "unknown"}-${pollCount}`}
        />
      )}

      {statusCheckDebugInfo && (
        <div className="mt-8">
          <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
        </div>
      )}
    </>
  );
};

export default BridgeAwaitingDeposit;
