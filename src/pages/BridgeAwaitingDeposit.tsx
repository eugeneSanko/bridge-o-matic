
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

// Include all valid statuses that should continue polling
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
  const [isPollingActive, setIsPollingActive] = useState(true); // Track if polling is active

  const {
    orderDetails: originalOrderDetails,
    loading,
    error,
    handleCopyAddress,
  } = useBridgeOrder(orderId, true, true);

  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  const { deepLink, addLog } = useDeepLink();
  const intervalRef = useRef(null);
  const lastKnownStatusRef = useRef(""); // To track the last known status

  // Debug state changes
  useEffect(() => {
    console.log("Original Order Details updated:", originalOrderDetails);
  }, [originalOrderDetails]);

  useEffect(() => {
    console.log("Order Details state updated:", orderDetails);
  }, [orderDetails]);

  // Handle received order details from the hook
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
    } else {
      setOrderDetails(originalOrderDetails);
    }

    // Track the current status for comparison later
    if (originalOrderDetails?.rawApiResponse?.status) {
      lastKnownStatusRef.current = originalOrderDetails.rawApiResponse.status;
    }
  }, [originalOrderDetails, simulateSuccess]);

  // Handle debug status change
  const handleStatusChange = (newStatus: BridgeStatus, mockApiResponse: ApiOrderResponse['data']) => {
    console.log(`Setting debug status to: ${newStatus}`, mockApiResponse);
    
    // Only update if we have order details
    if (!orderDetails) {
      toast({
        title: "Cannot change status",
        description: "No order details loaded yet",
        variant: "destructive",
      });
      return;
    }
    
    // Create updated order details with the new status
    const updatedOrderDetails = {
      ...orderDetails,
      currentStatus: newStatus, // Use uppercase API status
      rawApiResponse: {
        ...orderDetails.rawApiResponse,
        ...mockApiResponse,
        status: newStatus,
      },
    };
    
    // Update orderDetails state with new status
    setOrderDetails(updatedOrderDetails);
    lastKnownStatusRef.current = newStatus; // Update the last known status
    
    // Show toast notification
    toast({
      title: `Status Updated: ${newStatus}`,
      description: `Simulating bridge status: ${newStatus}`,
    });
    
    // Handle completion if status is DONE
    if (newStatus === "DONE") {
      handleOrderCompletion();
    } else if (REFRESHABLE_STATUSES.includes(newStatus)) {
      // Re-enable polling for refreshable statuses
      setTransactionSaved(false);
      setIsPollingActive(true);
    } else {
      // For any other non-refreshable status, disable polling
      setIsPollingActive(false);
    }
    
    // Force a polling count update to trigger re-renders
    setPollCount(prev => prev + 1);
  };

  // Centralized function to handle order completion
  const handleOrderCompletion = () => {
    console.log("Handling order completion");
    
    // Stop polling when complete
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsPollingActive(false);
    setTransactionSaved(true);
    
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

        // Update the order details with the new status
        setOrderDetails((prevDetails) => {
          if (!prevDetails) return null;
          
          return {
            ...prevDetails,
            currentStatus: status,
            rawApiResponse: data.data,
          };
        });

        // Update the last known status
        lastKnownStatusRef.current = status;

        // Increment poll count to force component updates
        setPollCount(prev => prev + 1);

        // Handle specific status transitions
        if (status === "DONE" && !transactionSaved) {
          handleOrderCompletion();
        } else if (!REFRESHABLE_STATUSES.includes(status)) {
          console.log(`Status ${status} is not refreshable, stopping polling`);
          clearInterval(intervalRef.current);
          setIsPollingActive(false);
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

  // Check status immediately on mount
  useEffect(() => {
    if (orderId && token) {
      console.log("Initial status check on component mount");
      checkOrderStatus();
    }
  }, [orderId, token]);

  // Auto-refresh for specific statuses every 15 seconds
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If polling is not active or necessary based on status, don't set a new interval
    if (!isPollingActive || !orderDetails || transactionSaved) {
      console.log("Polling is disabled or not needed");
      return;
    }

    const currentStatus = orderDetails.rawApiResponse?.status;
    
    // Only set polling for refreshable statuses
    if (currentStatus && REFRESHABLE_STATUSES.includes(currentStatus)) {
      console.log(`Setting up polling interval for status ${currentStatus}`);
      
      intervalRef.current = setInterval(() => {
        console.log("Polling interval triggered");
        checkOrderStatus();
      }, 15000);
    } else {
      console.log(`Status ${currentStatus} is not refreshable, not setting up polling`);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPollingActive, orderDetails?.rawApiResponse?.status, transactionSaved, orderId, token]);

  // Force a UI refresh for visual status updates
  const forceRefresh = () => {
    setPollCount(prev => prev + 1);
    checkOrderStatus();
  };

  return (
    <>
      {/* Debug status controls panel */}
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

      {/* Debug status display */}
      <div className="mb-4 p-2 bg-black/50 text-xs rounded">
        <p>Current API Status: {orderDetails?.rawApiResponse?.status || "N/A"}</p>
        <p>Polling Active: {isPollingActive ? "Yes" : "No"}</p>
        <p>Poll Count: {pollCount}</p>
        <p>Last Known Status: {lastKnownStatusRef.current || "None"}</p>
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
