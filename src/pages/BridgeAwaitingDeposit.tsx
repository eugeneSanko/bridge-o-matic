
import { useEffect, useState } from "react";
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

const BridgeAwaitingDeposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";
  
  // Always use real data and force API check
  const [apiAttempted, setApiAttempted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [manualStatusCheckAttempted, setManualStatusCheckAttempted] = useState(false);
  const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState(null);
  const [statusCheckError, setStatusCheckError] = useState(null);
  
  // Set forceApiCheck to true to always attempt API call
  const { orderDetails, loading, error, handleCopyAddress } = useBridgeOrder(
    orderId, 
    true, // Always try to fetch from API
    true  // Force API check even if we have local data
  );
  
  const { deepLink, logs, addLog } = useDeepLink();

  // Show message if no order data is found
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "No order information found",
        variant: "destructive"
      });
    } else {
      console.log(`Processing order ID: ${orderId} with token: ${token}`);
    }
  }, [orderId, token]);

  // Manual status check function that uses our bridge-status function
  const checkOrderStatus = async () => {
    if (!orderId || !token) {
      console.error("Missing order ID or token for status check");
      setStatusCheckError("Missing order ID or token");
      return;
    }

    try {
      console.log("Manually checking order status with bridge-status function");
      setManualStatusCheckAttempted(true);
      
      const { data, error } = await supabase.functions.invoke('bridge-status', {
        body: { id: orderId, token }
      });
      
      if (error) {
        console.error("Error calling bridge-status function:", error);
        setStatusCheckError(`Error: ${error.message}`);
        setStatusCheckDebugInfo({ error });
        return;
      }
      
      console.log("Status check response:", data);
      
      if (data.debugInfo) {
        setStatusCheckDebugInfo(data.debugInfo);
      }
      
      if (data.code === 0 && data.data) {
        // If we get a successful response, handle status updates
        const status = data.data.status;
        console.log(`Order status from API: ${status}`);
        
        // If the order is complete, navigate to the completion page
        if (status === 'DONE' && !navigating) {
          console.log("Order is complete, navigating to completion page");
          setNavigating(true);
          navigate(`/bridge/order-complete?orderId=${orderId}`);
        }
      } else {
        console.error("API returned an error:", data);
        setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setStatusCheckError(`Error: ${error.message}`);
    }
  };

  // Run a manual status check on component mount
  useEffect(() => {
    if (orderId && token && !manualStatusCheckAttempted) {
      checkOrderStatus();
    }
  }, [orderId, token, manualStatusCheckAttempted]);

  useEffect(() => {
    if (!apiAttempted && (loading || error || orderDetails)) {
      setApiAttempted(true);
      
      // If we get an error, show a toast
      if (error) {
        console.error("API error detected:", error);
        toast({
          title: "Connection Error",
          description: "Could not fetch order details from the exchange API.",
          variant: "destructive"
        });
      }
    }
  }, [apiAttempted, loading, error, orderDetails]);

  useEffect(() => {
    if (!deepLink) return;

    const url = new URL(deepLink);
    const params = url.searchParams;

    if (params.get("errorCode")) {
      addLog(JSON.stringify(Object.fromEntries([...params]), null, 2));
      return;
    }

    // Only navigate to completion page if we have confirmation of completed status
    // and we're not already navigating
    if ((orderDetails?.currentStatus === 'completed' || 
         orderDetails?.rawApiResponse?.status === 'DONE') && 
        !navigating) {
      console.log("Order is complete, navigating to completion page");
      setNavigating(true);
      navigate(`/bridge/order-complete?orderId=${orderDetails.orderId}`);
      return;
    }

    if (params.has("status")) {
      const status = params.get("status");
      addLog(`Status from deep link: ${status}`);
      
      // If we get a completed status from the deep link, navigate to completion
      if (status === 'completed' && !navigating) {
        console.log("Got completed status from deep link");
        setNavigating(true);
        navigate(`/bridge/order-complete?orderId=${orderId}`);
      }
    }

    if (params.has("txId")) {
      const txId = params.get("txId");
      addLog(`Transaction ID from deep link: ${txId}`);
    }
  }, [deepLink, orderDetails?.currentStatus, orderDetails?.orderId, orderDetails?.rawApiResponse?.status, orderId, addLog, navigate, navigating]);

  // Periodically check status
  useEffect(() => {
    if (!orderId || !token) return;
    
    const intervalId = setInterval(() => {
      checkOrderStatus();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [orderId, token]);

  // Show loading state while fetching order details
  if (loading) {
    return <LoadingState />;
  }

  // Show error state if there was an error
  if (error) {
    return (
      <>
        <ErrorState error={error} />
        {statusCheckDebugInfo && (
          <div className="mt-8">
            <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
          </div>
        )}
      </>
    );
  }

  // Show empty state if no order details were found
  if (!orderDetails) {
    return (
      <>
        <EmptyState />
        {statusCheckDebugInfo && (
          <div className="mt-8">
            <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
          </div>
        )}
      </>
    );
  }

  // Show the bridge transaction with the order details
  return (
    <>
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleCopyAddress} 
      />
      {statusCheckDebugInfo && (
        <div className="mt-8">
          <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
        </div>
      )}
    </>
  );
};

export default BridgeAwaitingDeposit;
