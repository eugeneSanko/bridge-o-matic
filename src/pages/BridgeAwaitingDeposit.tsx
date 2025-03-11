import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBridgeOrder } from "@/hooks/useBridgeOrder";
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
  const token = searchParams.get("token") || (orderId || "");
  
  // Always use real data since we're now storing it
  const [isUsingStatic, setIsUsingStatic] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  
  const { orderDetails, loading, error, handleCopyAddress } = useBridgeOrder(
    token, 
    !apiAttempted
  );
  
  const { deepLink, logs, addLog } = useDeepLink();

  // Show message if no order data is found
  useEffect(() => {
    if (!token) {
      toast({
        title: "Missing Order Token",
        description: "No order information found",
        variant: "destructive"
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Missing Order Token",
        description: "Using demo data instead of a real order",
      });
      setIsUsingStatic(true);
    } else {
      console.log(`Processing order token: ${token}`);
    }
  }, [token]);

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

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!orderDetails) {
    return <EmptyState />;
  }

  return (
    <BridgeTransaction 
      orderDetails={orderDetails} 
      onCopyAddress={handleCopyAddress} 
    />
  );
};

export default BridgeAwaitingDeposit;
