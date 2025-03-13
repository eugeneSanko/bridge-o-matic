
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useBridgeOrder } from "@/hooks/useBridgeOrder";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useOrderStatusPolling } from "@/hooks/useOrderStatusPolling";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { SimulationToggle } from "@/components/bridge/SimulationToggle";
import { DebugInfoDisplay } from "@/components/bridge/DebugInfoDisplay";
import { 
  CompletedTransactionSaver, 
  useCompletedTransactionSaver 
} from "@/components/bridge/CompletedTransactionSaver";
import { toast } from "@/hooks/use-toast";

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
    handleCopyAddress 
  } = useBridgeOrder(
    orderId, 
    true, // Always try to fetch from API
    true  // Force API check even if we have local data
  );
  
  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  
  // Process deep links for transaction status updates
  const { deepLink, addLog } = useDeepLink();

  // Transaction saver hook
  const { saveCompletedTransaction } = useCompletedTransactionSaver({
    token,
    statusCheckDebugInfo,
    setTransactionSaved
  });

  // Handle order completion
  const handleTransactionComplete = useCallback((details, apiResponse) => {
    // Save completed transaction to Supabase
    if (!transactionSaved) {
      saveCompletedTransaction(details, apiResponse, false, originalOrderDetails);
    }
  }, [saveCompletedTransaction, transactionSaved, originalOrderDetails]);

  // Use custom hook for order status polling
  const { statusCheckError } = useOrderStatusPolling({
    orderId,
    token,
    originalOrderDetails,
    setOrderDetails,
    onTransactionComplete: handleTransactionComplete,
    setStatusCheckDebugInfo
  });

  // Apply simulated success state if enabled
  useEffect(() => {
    if (!originalOrderDetails) return;
    
    if (simulateSuccess) {
      const simulatedDetails = {
        ...originalOrderDetails,
        currentStatus: "completed",
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE"
        }
      };
      setOrderDetails(simulatedDetails);
      
      console.log("Simulating DONE state:", {
        originalStatus: originalOrderDetails.currentStatus,
        originalApiStatus: originalOrderDetails.rawApiResponse?.status,
        finalStatus: "completed",
        finalApiStatus: "DONE",
        simulatedDetails
      });
    } else {
      setOrderDetails(originalOrderDetails);
      
      console.log("Using original state:", {
        originalStatus: originalOrderDetails.currentStatus,
        originalApiStatus: originalOrderDetails.rawApiResponse?.status
      });
    }
  }, [originalOrderDetails, simulateSuccess]);

  // Check for missing order ID
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

  // Track API attempt status
  useEffect(() => {
    if (!apiAttempted && (loading || error || orderDetails)) {
      setApiAttempted(true);
      
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

  // Process deep link updates
  useEffect(() => {
    if (!deepLink) return;

    const url = new URL(deepLink);
    const params = url.searchParams;

    if (params.get("errorCode")) {
      addLog(JSON.stringify(Object.fromEntries([...params]), null, 2));
      return;
    }

    if (params.has("status")) {
      const status = params.get("status");
      addLog(`Status from deep link: ${status}`);
      
      if (status === 'completed') {
        console.log("Got completed status from deep link");
        toast({
          title: "Transaction Complete",
          description: `Your transaction has been completed successfully.`,
          variant: "default"
        });
      }
    }

    if (params.has("txId")) {
      const txId = params.get("txId");
      addLog(`Transaction ID from deep link: ${txId}`);
    }
  }, [deepLink, addLog]);

  // Render appropriate component based on loading/error state
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <>
        <ErrorState error={error} />
        <DebugInfoDisplay 
          statusCheckDebugInfo={statusCheckDebugInfo} 
          error={error}
          orderDetails={null}
        />
      </>
    );
  }

  if (!orderDetails) {
    return (
      <>
        <EmptyState />
        <DebugInfoDisplay 
          statusCheckDebugInfo={statusCheckDebugInfo} 
          error={null}
          orderDetails={null}
        />
      </>
    );
  }

  return (
    <>
      <SimulationToggle
        simulateSuccess={simulateSuccess}
        setSimulateSuccess={setSimulateSuccess}
      />
      
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleCopyAddress} 
      />
      
      <DebugInfoDisplay 
        statusCheckDebugInfo={statusCheckDebugInfo} 
        error={null}
        orderDetails={orderDetails}
      />
      
      <CompletedTransactionSaver
        orderDetails={orderDetails}
        simulateSuccess={simulateSuccess}
        originalOrderDetails={originalOrderDetails}
        token={token}
        transactionSaved={transactionSaved}
        setTransactionSaved={setTransactionSaved}
        statusCheckDebugInfo={statusCheckDebugInfo}
      />
    </>
  );
};

export default BridgeAwaitingDeposit;
