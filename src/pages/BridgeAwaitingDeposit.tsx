import { useEffect, useState, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CompletedTransaction } from "@/types/bridge";

const POLLING_INTERVALS = {
  DEFAULT: 15000,     // Default: 15 seconds
  NEW: 10000,         // Awaiting deposit: 10 seconds  
  PENDING: 10000,     // Received, waiting for confirmations: 10 seconds
  EXCHANGE: 20000,    // Exchange in progress: 20 seconds
  WITHDRAW: 20000,    // Sending funds: 20 seconds
  DONE: null,         // Completed: stop polling completely
  EXPIRED: null,      // Expired: no polling needed
  EMERGENCY: null     // Emergency: no polling needed
};

const ACTIVE_POLLING_STATUSES = ['NEW', 'PENDING', 'EXCHANGE', 'WITHDRAW'];

const BridgeAwaitingDeposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";
  
  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [manualStatusCheckAttempted, setManualStatusCheckAttempted] = useState(false);
  const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState(null);
  const [statusCheckError, setStatusCheckError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(POLLING_INTERVALS.DEFAULT);
  const [lastPollTimestamp, setLastPollTimestamp] = useState(0);
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);

  const { orderDetails: originalOrderDetails, loading, error, handleCopyAddress } = useBridgeOrder(
    orderId, 
    true, // Always try to fetch from API
    true  // Force API check even if we have local data
  );
  
  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  
  useEffect(() => {
    if (!originalOrderDetails) return;
    
    if (simulateSuccess) {
      setOrderDetails({
        ...originalOrderDetails,
        currentStatus: "completed",
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE"
        }
      });
    } else {
      setOrderDetails(originalOrderDetails);
    }
  }, [originalOrderDetails, simulateSuccess]);
  
  const { deepLink, logs, addLog } = useDeepLink();

  const checkCompletedTransaction = useCallback(async (orderId: string) => {
    try {
      const { data: transaction, error } = await supabase
        .from('completed_bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking completed transaction:", error);
        return null;
      }
      
      return transaction as unknown as CompletedTransaction; 
    } catch (error) {
      console.error("Error in checkCompletedTransaction:", error);
      return null;
    }
  }, []);

  const collectClientMetadata = useCallback(() => {
    const languagesArray = navigator.languages 
      ? Array.from(navigator.languages) 
      : navigator.language 
        ? [navigator.language] 
        : [];
    
    const metadata = {
      ip: null, // We'll get this on the server side
      user_agent: navigator.userAgent || null,
      languages: languagesArray
    };
    
    console.log("Collected client metadata:", metadata);
    return metadata;
  }, []);

  const saveCompletedTransaction = useCallback(async () => {
    if (!orderDetails || !orderDetails.rawApiResponse || transactionSaved) return;
    
    const apiStatus = orderDetails.rawApiResponse.status;
    if (apiStatus !== "DONE") return;
    
    try {
      console.log("Saving completed transaction to Supabase...");
      
      const clientMetadata = collectClientMetadata();
      
      const { data, error } = await supabase
        .from('completed_bridge_transactions')
        .insert({
          ff_order_id: orderDetails.ffOrderId,
          ff_order_token: orderDetails.ffOrderToken,
          from_currency: orderDetails.fromCurrency,
          to_currency: orderDetails.toCurrency,
          amount: parseFloat(orderDetails.depositAmount),
          destination_address: orderDetails.destinationAddress,
          deposit_address: orderDetails.depositAddress,
          client_metadata: clientMetadata,
          raw_api_response: orderDetails.rawApiResponse,
          status: "completed"
        });
      
      if (error) {
        console.error("Error saving transaction to Supabase:", error);
        return;
      }
      
      console.log("Transaction saved successfully:", data);
      setTransactionSaved(true);
      
      toast({
        title: "Transaction Saved",
        description: "Your transaction has been successfully recorded in our system.",
        variant: "default"
      });
      
      setPollingActive(false);
      setPollingInterval(null);
      
    } catch (error) {
      console.error("Error in saveCompletedTransaction:", error);
    }
  }, [orderDetails, transactionSaved, collectClientMetadata]);

  useEffect(() => {
    if (!orderDetails || !orderDetails.rawApiResponse) return;
    
    const apiStatus = orderDetails.rawApiResponse.status;
    console.log(`Current API status: ${apiStatus}`);
    
    const newInterval = POLLING_INTERVALS[apiStatus] ?? POLLING_INTERVALS.DEFAULT;
    console.log(`Setting polling interval to ${newInterval === null ? 'none' : `${newInterval}ms`} for status ${apiStatus}`);
    setPollingInterval(newInterval);
    
    const shouldPollStatus = ACTIVE_POLLING_STATUSES.includes(apiStatus);
    
    if (apiStatus === "DONE") {
      if (!transactionSaved) {
        saveCompletedTransaction();
      } else {
        console.log("Transaction is complete and saved, stopping polling");
        setPollingActive(false);
      }
    } else if (apiStatus === "EXPIRED" || apiStatus === "EMERGENCY") {
      console.log(`Status is ${apiStatus}, stopping polling`);
      setPollingActive(false);
    } else if (shouldPollStatus) {
      console.log(`Status is ${apiStatus}, ensuring polling is active`);
      setPollingActive(true);
    }
  }, [orderDetails?.rawApiResponse?.status, transactionSaved, saveCompletedTransaction]);

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

  const checkOrderStatus = useCallback(async (force = false) => {
    if (!orderId || !token) {
      console.error("Missing order ID or token for status check");
      setStatusCheckError("Missing order ID or token");
      return;
    }
    
    const currentApiStatus = orderDetails?.rawApiResponse?.status;
    
    if (!force && currentApiStatus === "DONE" && transactionSaved) {
      console.log("Status is DONE and transaction is saved, skipping status check");
      return;
    }
    
    if (!pollingActive && !force) {
      console.log("Polling is disabled, skipping status check");
      return;
    }
    
    if (pollingInterval === null && !force) {
      console.log("Polling interval is null for current status, skipping check");
      return;
    }
    
    const now = Date.now();
    if (!force && (now - lastPollTimestamp) < pollingInterval) {
      console.log(`Not enough time elapsed since last poll (${(now - lastPollTimestamp)/1000}s < ${pollingInterval/1000}s), skipping`);
      return;
    }
    
    setLastPollTimestamp(now);
    console.log(`${force ? 'Forcing' : 'Scheduled'} order status check at ${new Date().toISOString()}`);

    try {
      setManualStatusCheckAttempted(true);
      
      const completedTransaction = await checkCompletedTransaction(orderId);
      if (completedTransaction) {
        console.log("Found completed transaction in database:", completedTransaction);
        setOrderDetails(prevDetails => ({
          ...prevDetails!,
          currentStatus: "completed",
          rawApiResponse: completedTransaction.raw_api_response || {
            ...prevDetails?.rawApiResponse,
            status: "DONE"
          }
        }));
        
        setPollingActive(false);
        setPollingInterval(null);
        setTransactionSaved(true);
        return;
      }

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
        const status = data.data.status;
        console.log(`Order status from API: ${status}`);
        
        if (status === 'DONE') {
          console.log("Order is complete, preparing to save data");
          toast({
            title: "Transaction Complete",
            description: `Your transaction has been completed successfully.`,
            variant: "default"
          });
          
          setOrderDetails(prevDetails => {
            if (!prevDetails) return null;
            return {
              ...prevDetails,
              currentStatus: "completed",
              rawApiResponse: data.data
            };
          });
          
          if (!transactionSaved && data.data.id) {
            saveCompletedTransaction();
          } else if (transactionSaved) {
            setPollingActive(false);
            setPollingInterval(null);
          } else if (!data.data.id) {
            console.error("Cannot save transaction: Missing order ID in API response");
          }
        } else {
          setOrderDetails(prevDetails => {
            if (!prevDetails) return null;
            return {
              ...prevDetails,
              currentStatus: status.toLowerCase(),
              rawApiResponse: data.data
            };
          });
        }
      } else {
        console.error("API returned an error:", data);
        setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setStatusCheckError(`Error: ${error.message}`);
    }
  }, [orderId, token, pollingInterval, lastPollTimestamp, transactionSaved, saveCompletedTransaction, checkCompletedTransaction, pollingActive, orderDetails]);

  useEffect(() => {
    if (orderId && token && !manualStatusCheckAttempted) {
      console.log("Performing initial status check");
      checkOrderStatus(true);
    }
  }, [orderId, token, manualStatusCheckAttempted, checkOrderStatus]);

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
        
        if (!transactionSaved) {
          saveCompletedTransaction();
        }
      }
    }

    if (params.has("txId")) {
      const txId = params.get("txId");
      addLog(`Transaction ID from deep link: ${txId}`);
    }
  }, [deepLink, addLog, transactionSaved, saveCompletedTransaction]);

  useEffect(() => {
    let intervalId: number | null = null;
    
    if (!orderId || !token || pollingInterval === null || !pollingActive) {
      console.log("Not setting up polling - inactive or disabled", {
        orderId: !!orderId,
        token: !!token,
        pollingInterval,
        pollingActive
      });
      return;
    }
    
    console.log(`Setting up polling with ${pollingInterval}ms interval, polling is ${pollingActive ? 'active' : 'inactive'}`);
    
    intervalId = window.setInterval(() => {
      const currentStatus = orderDetails?.rawApiResponse?.status;
      
      console.log(`Polling check - Status: ${currentStatus}, Active: ${pollingActive}, Saved: ${transactionSaved}`);
      
      if (currentStatus === "DONE" && transactionSaved) {
        console.log("Skipping status check - transaction is complete and saved");
        if (intervalId !== null) {
          console.log('Clearing polling interval - transaction complete');
          clearInterval(intervalId);
        }
      } 
      else if (currentStatus === "EXPIRED" || currentStatus === "EMERGENCY") {
        console.log(`Skipping status check - transaction is in terminal state: ${currentStatus}`);
        if (intervalId !== null) {
          console.log(`Clearing polling interval - transaction in terminal state: ${currentStatus}`);
          clearInterval(intervalId);
        }
      }
      else {
        console.log(`Executing scheduled status check for status: ${currentStatus}`);
        checkOrderStatus();
      }
    }, pollingInterval);
    
    return () => {
      if (intervalId !== null) {
        console.log('Clearing polling interval - cleanup');
        clearInterval(intervalId);
      }
    };
  }, [orderId, token, pollingInterval, checkOrderStatus, orderDetails, transactionSaved, pollingActive]);

  if (loading) {
    return <LoadingState />;
  }

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

  return (
    <>
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
