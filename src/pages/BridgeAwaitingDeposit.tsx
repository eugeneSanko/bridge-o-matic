
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useBridgeOrder } from "@/hooks/useBridgeOrder";
import { useOrderStatusPolling } from "@/hooks/useOrderStatusPolling";
import { useBridgeDeepLink } from "@/hooks/useBridgeDeepLink";
import { OrderParameterValidator } from "@/components/bridge/OrderParameterValidator";
import { ApiStatusMonitor } from "@/components/bridge/ApiStatusMonitor";
import { BridgeStatusRenderer } from "@/components/bridge/BridgeStatusRenderer";

const BridgeAwaitingDeposit = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";
  
  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState(null);
  
  // Load order details from the bridge API
  const { 
    orderDetails: originalOrderDetails, 
    loading, 
    error, 
    handleCopyAddress,
    setEmergencyActionTaken 
  } = useBridgeOrder(
    orderId, 
    token,
    true, // Always try to fetch from API
    true  // Force API check even if we have local data
  );
  
  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  
  // Process deep links for transaction status updates
  useBridgeDeepLink();

  // Handle order completion
  const handleTransactionComplete = (details, apiResponse) => {
    console.log("Transaction complete callback triggered", {
      details,
      apiResponse,
      transactionSaved
    });
    
    // The actual saving logic is now in the CompletedTransactionSaver component
    // This function is just for additional logging or future extensibility
  };

  // Use custom hook for order status polling
  const { statusCheckError, checkOrderStatus } = useOrderStatusPolling({
    orderId,
    token,
    originalOrderDetails,
    setOrderDetails,
    onTransactionComplete: handleTransactionComplete,
    setStatusCheckDebugInfo
  });

  // Update orderDetails when originalOrderDetails changes
  useEffect(() => {
    if (originalOrderDetails) {
      // Ensure token is passed to the component
      setOrderDetails({
        ...originalOrderDetails,
        token: token
      });
    }
  }, [originalOrderDetails, token]);

  return (
    <div className="px-3 md:px-8 pt-4 pb-12 max-w-full overflow-x-hidden">
      <OrderParameterValidator orderId={orderId} token={token} />
      
      <ApiStatusMonitor
        apiAttempted={apiAttempted}
        setApiAttempted={setApiAttempted}
        loading={loading}
        error={error}
        orderDetails={orderDetails}
      />
      
      <BridgeStatusRenderer
        loading={loading}
        error={error}
        orderDetails={orderDetails}
        handleCopyAddress={handleCopyAddress}
        statusCheckDebugInfo={statusCheckDebugInfo}
        simulateSuccess={simulateSuccess}
        originalOrderDetails={originalOrderDetails}
        token={token}
        transactionSaved={transactionSaved}
        setTransactionSaved={setTransactionSaved}
        checkOrderStatus={() => checkOrderStatus && checkOrderStatus(true)}
        setEmergencyActionTaken={setEmergencyActionTaken}
      />
    </div>
  );
};

export default BridgeAwaitingDeposit;
