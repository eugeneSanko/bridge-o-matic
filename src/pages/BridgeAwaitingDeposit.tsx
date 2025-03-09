
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBridgeOrder, OrderDetails } from "@/hooks/useBridgeOrder";
import { useDeepLink } from "@/hooks/useDeepLink";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { toast } from "@/hooks/use-toast";

const BridgeAwaitingDeposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  // Static order details for demo purposes
  const staticOrderDetails: OrderDetails = {
    depositAddress: "3P3QsMVK89JBNqZQv5zMAKG8FK3kJM4rjt",
    depositAmount: "0.05",
    currentStatus: "pending", // Options: pending, processing, exchanging, sending, completed
    fromCurrency: "btc",
    toCurrency: "eth",
    orderId: orderId || "demo123456789",
    destinationAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
    timeRemaining: "29:59",
    ffOrderId: "ff1234567890",
    ffOrderToken: orderId || "testtoken123456789", // Use orderId as token if available
  };

  // Always use static data if no orderId, or if we've had API errors
  const [isUsingStatic, setIsUsingStatic] = useState(!orderId);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  
  // We need a non-retry version of the hook
  const { orderDetails, loading, error, handleCopyAddress } = useBridgeOrder(
    isUsingStatic ? null : orderId, 
    !apiAttempted  // Only fetch if we haven't attempted yet
  );
  
  const { deepLink, logs, addLog } = useDeepLink();

  // Check if we have orderId and show appropriate message
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "Using demo data instead of a real order",
      });
      setIsUsingStatic(true);
    } else {
      console.log(`Processing order or token: ${orderId}`);
    }
  }, [orderId]);

  // When real API was attempted, mark it
  useEffect(() => {
    if (!isUsingStatic && !apiAttempted && (loading || error || orderDetails)) {
      setApiAttempted(true);
      
      // If we get an error, switch to static data
      if (error) {
        console.log("API error detected, switching to static data");
        setIsUsingStatic(true);
        toast({
          title: "Connection Error",
          description: "Could not fetch order details. Using demo data instead.",
          variant: "destructive"
        });
      }
    }
  }, [isUsingStatic, apiAttempted, loading, error, orderDetails]);

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
    if (orderDetails?.currentStatus === 'completed' && !navigating) {
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
  }, [deepLink, orderDetails?.currentStatus, orderDetails?.orderId, orderId, addLog, navigate, navigating]);

  // Add toggle button to switch between static and dynamic data
  const toggleDataSource = () => {
    setIsUsingStatic(!isUsingStatic);
    // Reset API attempted flag when toggling back to dynamic data
    if (isUsingStatic) {
      setApiAttempted(false);
    }
  };

  if (!isUsingStatic && loading) {
    return <LoadingState />;
  }

  if (!isUsingStatic && error) {
    return <ErrorState error={error} />;
  }

  if (!isUsingStatic && !orderDetails) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={toggleDataSource}
          className="bg-[#0FA0CE] px-4 py-2 rounded-md text-white font-medium"
        >
          {isUsingStatic ? "Switch to Dynamic Data" : "Switch to Static Data"}
        </button>
      </div>
      <BridgeTransaction 
        orderDetails={isUsingStatic ? staticOrderDetails : orderDetails!} 
        onCopyAddress={handleCopyAddress} 
      />
    </>
  );
};

export default BridgeAwaitingDeposit;
