
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
  const [pollCount, setPollCount] = useState(0); // Added to force re-renders on poll

  const {
    orderDetails: originalOrderDetails,
    loading,
    error,
    handleCopyAddress,
  } = useBridgeOrder(orderId, true, true);

  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  const { deepLink, addLog } = useDeepLink();
  const intervalRef = useRef(null);

  // Debug state changes
  useEffect(() => {
    console.log("Original Order Details updated:", originalOrderDetails);
  }, [originalOrderDetails]);

  useEffect(() => {
    console.log("Order Details state updated:", orderDetails);
  }, [orderDetails]);

  useEffect(() => {
    if (!originalOrderDetails) return;

    if (simulateSuccess) {
      setOrderDetails({
        ...originalOrderDetails,
        currentStatus: "DONE", // Keep original API status case
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE",
        },
      });
    } else {
      setOrderDetails(originalOrderDetails);
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
    
    // Show toast notification
    toast({
      title: `Status Updated: ${newStatus}`,
      description: `Simulating bridge status: ${newStatus}`,
    });
    
    // Handle completion if status is DONE
    if (newStatus === "DONE") {
      setTransactionSaved(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else if (REFRESHABLE_STATUSES.includes(newStatus)) {
      // Re-enable polling for refreshable statuses
      setTransactionSaved(false);
    }
    
    // Force a polling count update to trigger re-renders
    setPollCount(prev => prev + 1);
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
        console.log(`Order ${orderId} status update: ${status}`);

        // Important: Preserve the original case of the API status
        setOrderDetails((prevDetails) => ({
          ...prevDetails!,
          currentStatus: status, // Keep the original API status case (uppercase)
          rawApiResponse: data.data,
        }));

        // Increment poll count to force component updates
        setPollCount(prev => prev + 1);

        if (status === "DONE" && !transactionSaved) {
          toast({
            title: "Transaction Complete",
            description: `Your transaction has been completed successfully.`,
            variant: "default",
          });

          setTransactionSaved(true);
          clearInterval(intervalRef.current);
          // navigate(`/bridge/order-complete?orderId=${orderId}`);
        }

        if (!REFRESHABLE_STATUSES.includes(status)) {
          console.log(`Status ${status} is not refreshable, stopping polling`);
          clearInterval(intervalRef.current);
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
    if (
      !orderDetails ||
      !orderDetails.rawApiResponse?.status ||
      !REFRESHABLE_STATUSES.includes(orderDetails.rawApiResponse.status)
    ) {
      clearInterval(intervalRef.current);
      return;
    }

    // Clear existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`Setting up polling interval for status ${orderDetails.rawApiResponse.status}`);
    intervalRef.current = setInterval(() => {
      console.log("Polling interval triggered");
      checkOrderStatus();
    }, 15000); // Changed to 15 seconds as per plan

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [orderDetails?.rawApiResponse?.status, orderId, token]);

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

      <Button onClick={checkOrderStatus} className="my-4">
        Refresh Status
      </Button>

      {/* Debug status display */}
      <div className="mb-4 p-2 bg-black/50 text-xs rounded">
        <p>Current API Status: {orderDetails?.rawApiResponse?.status || "N/A"}</p>
        <p>Poll Count: {pollCount}</p>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {!orderDetails && <EmptyState />}

      {orderDetails && (
        <BridgeTransaction
          orderDetails={orderDetails}
          onCopyAddress={handleCopyAddress}
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
