
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
    ffOrderId: orderId || "ff1234567890",
    ffOrderToken: "testtoken123456789",
  };

  // If we have a real orderId from the URL, use actual data, otherwise use static data
  const [isUsingStatic, setIsUsingStatic] = useState(!orderId);
  const { orderDetails, loading, error, handleCopyAddress } = useBridgeOrder(isUsingStatic ? null : orderId);
  const { deepLink, logs, addLog } = useDeepLink();

  // Check if we have orderId and show appropriate message
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "Using demo data instead of a real order",
      });
    } else {
      console.log(`Processing order: ${orderId}`);
    }
  }, [orderId]);

  useEffect(() => {
    if (!deepLink) return;

    const url = new URL(deepLink);
    const params = url.searchParams;

    if (params.get("errorCode")) {
      addLog(JSON.stringify(Object.fromEntries([...params]), null, 2));
      return;
    }

    if (orderDetails?.currentStatus === 'completed') {
      window.location.href = `/bridge/order-complete?orderId=${orderDetails.orderId}`;
      return;
    }

    if (params.has("status")) {
      const status = params.get("status");
      addLog(`Status from deep link: ${status}`);
    }

    if (params.has("txId")) {
      const txId = params.get("txId");
      addLog(`Transaction ID from deep link: ${txId}`);
    }
  }, [deepLink, orderDetails?.currentStatus, orderDetails?.orderId, addLog]);

  // Add toggle button to switch between static and dynamic data
  const toggleDataSource = () => {
    setIsUsingStatic(!isUsingStatic);
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
