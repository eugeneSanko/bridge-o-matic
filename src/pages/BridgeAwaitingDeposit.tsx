import { useEffect, useState, useCallback, useRef } from "react";
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
  NEW: 15000,         // Awaiting deposit: 15 seconds
  PENDING: 15000,     // Received, waiting for confirmations: 15 seconds
  EXCHANGE: 20000,    // Exchange in progress: 20 seconds
  WITHDRAW: 20000,    // Sending funds: 20 seconds
  DONE: null,         // Completed: stop polling completely
  EXPIRED: null,      // Expired: no polling needed
  EMERGENCY: null     // Emergency: no polling needed
};

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
  const [lastPollTimestamp, setLastPollTimestamp] = useState(Date.now()); // Initialize with current time
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [debugPollingInfo, setDebugPollingInfo] = useState({
    lastPolled: 'Never',
    nextPoll: 'Unknown',
    interval: POLLING_INTERVALS.DEFAULT
  });
  
  const intervalIdRef = useRef<number | null>(null);
  
  const { 
    orderDetails: originalOrderDetails, 
    loading, 
    error, 
    handleCopyAddress,
    fetchOrderDetails,
    ACTIVE_POLLING_STATUSES,
    TERMINAL_STATUSES
  } = useBridgeOrder(
    orderId, 
    true, // Always try to fetch from API
    false  // Don't force API check on initial load - we'll handle polling ourselves
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
      console.log(`Checking if order ${orderId} is already completed in database`);
      const { data: transaction, error } = await supabase
        .from('completed_bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking completed transaction:", error);
        return null;
      }
      
      console.log("Completed transaction check result:", transaction ? "Found" : "Not found");
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
        title: "Transaction Complete",
        description: "Your transaction has been completed successfully.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error in saveCompletedTransaction:", error);
    }
  }, [orderDetails, transactionSaved, collectClientMetadata]);

  useEffect(() => {
    if (!orderDetails || !orderDetails.rawApiResponse) return;
    
    const apiStatus = orderDetails.rawApiResponse.status;
    console.log(`Current API status: ${apiStatus}, determining polling behavior...`);
    
    const newInterval = POLLING_INTERVALS[apiStatus] ?? POLLING_INTERVALS.DEFAULT;
    console.log(`Setting polling interval to ${newInterval === null ? 'none' : `${newInterval}ms`} for status ${apiStatus}`);
    setPollingInterval(newInterval);
    
    if (apiStatus === "DONE" || apiStatus === "EXPIRED" || apiStatus === "EMERGENCY") {
      console.log(`Status ${apiStatus} is terminal, stopping polling`);
      setPollingActive(false);
    } else {
      console.log(`Status ${apiStatus} requires polling, setting polling active`);
      setPollingActive(true);
    }
    
    if (apiStatus === "DONE" && !transactionSaved) {
      saveCompletedTransaction();
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
    
    if (!pollingActive && !force) {
      console.log("Polling is disabled for current status, skipping check");
      return;
    }
    
    const now = Date.now();
    
    if (!force && (now - lastPollTimestamp) < pollingInterval) {
      const timeLeft = pollingInterval - (now - lastPollTimestamp);
      console.log(`Not enough time elapsed since last poll (${(now - lastPollTimestamp)/1000}s), next poll in ${timeLeft/1000}s`);
      
      setDebugPollingInfo({
        lastPolled: new Date(lastPollTimestamp).toLocaleTimeString(),
        nextPoll: new Date(lastPollTimestamp + pollingInterval).toLocaleTimeString(),
        interval: pollingInterval
      });
      
      return;
    }
    
    console.log(`${force ? 'Forcing' : 'Scheduled'} order status check for ${orderId}`);
    setLastPollTimestamp(now);
    setManualStatusCheckAttempted(true);
    
    const nextPollTime = now + pollingInterval;
    setDebugPollingInfo({
      lastPolled: new Date(now).toLocaleTimeString(),
      nextPoll: pollingInterval ? new Date(nextPollTime).toLocaleTimeString() : 'Never (polling stopped)',
      interval: pollingInterval
    });

    try {
      console.log(`Calling bridge-status function with id: ${orderId} and token: ${token}`);
      const { data, error } = await supabase.functions.invoke('bridge-status', {
        body: { id: orderId, token }
      });
      
      if (error) {
        console.error("Error calling bridge-status function:", error);
        setStatusCheckError(`Error: ${error.message}`);
        setStatusCheckDebugInfo({ error });
        return;
      }
      
      console.log("Status check API response:", data);
      
      if (data.debugInfo) {
        setStatusCheckDebugInfo(data.debugInfo);
      }
      
      if (data.code === 0 && data.data) {
        console.log("Full API response data:", JSON.stringify(data.data, null, 2));
        
        const apiStatus = data.data.status;
        console.log(`Order status from API: ${apiStatus}`);
        
        // Update orderDetails with the new API response
        setOrderDetails(prevDetails => {
          if (!prevDetails) return null;
          
          // Ensure we're updating with the complete API response
          const updatedDetails = {
            ...prevDetails,
            currentStatus: apiStatus.toLowerCase(),
            rawApiResponse: data.data  // Store the complete API response
          };
          
          console.log("Updated order details:", updatedDetails);
          return updatedDetails;
        });

        // Update polling interval based on status
        if (apiStatus === 'DONE' || apiStatus === 'EXPIRED' || apiStatus === 'EMERGENCY') {
          console.log(`Status ${apiStatus} is terminal, stopping polling`);
          setPollingActive(false);
          setPollingInterval(null);
          
          if (apiStatus === 'DONE') {
            toast({
              title: "Transaction Complete",
              description: "Your transaction has been completed successfully."
            });
          }
        } else {
          // Adjust polling intervals based on status
          const newInterval = POLLING_INTERVALS[apiStatus] || POLLING_INTERVALS.DEFAULT;
          console.log(`Setting new polling interval for status ${apiStatus}: ${newInterval}ms`);
          setPollingInterval(newInterval);
          setPollingActive(true);
        }
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setStatusCheckError(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [orderId, token, pollingInterval, lastPollTimestamp, pollingActive]);

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
    if (intervalIdRef.current !== null) {
      console.log("Clearing existing interval:", intervalIdRef.current);
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    if (!orderId || !token) {
      console.log("Not setting up polling - missing orderId or token");
      return;
    }
    
    if (!pollingActive) {
      console.log("Not setting up polling - polling is disabled");
      return;
    }
    
    if (pollingInterval === null) {
      console.log("Not setting up polling - polling interval is null (terminal status)");
      return;
    }
    
    console.log(`Setting up NEW polling interval: ${pollingInterval}ms for order ${orderId}`);
    
    const id = window.setInterval(() => {
      console.log(`Polling interval triggered at ${new Date().toLocaleTimeString()}, checking order status`);
      checkOrderStatus(false);
    }, pollingInterval);
    
    intervalIdRef.current = id;
    console.log("Created new interval with ID:", id);
    
    // Perform initial check
    checkOrderStatus(true);
    
    return () => {
      if (intervalIdRef.current !== null) {
        console.log("Cleaning up interval:", intervalIdRef.current);
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [orderId, token, pollingActive, pollingInterval, checkOrderStatus]);

  const handleForceStatusCheck = () => {
    console.log("Manually forcing status check");
    checkOrderStatus(true);
  };

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
      
      <div className="mt-4 flex justify-center">
        <div className="text-center text-sm text-gray-500">
          <p>Poll Status: {pollingActive ? 'Active' : 'Inactive'}</p>
          <p>Current Status: {orderDetails.rawApiResponse?.status || 'Unknown'}</p>
          <p>Mapped Status: {orderDetails.currentStatus}</p>
          <p>Last Poll: {debugPollingInfo.lastPolled}</p>
          <p>Next Poll: {debugPollingInfo.nextPoll}</p>
          <p>Interval: {debugPollingInfo.interval ? `${debugPollingInfo.interval/1000}s` : 'Disabled'}</p>
          <p>Interval ID: {intervalIdRef.current || 'None'}</p>
          <button 
            onClick={handleForceStatusCheck}
            className="mt-2 px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition-colors"
          >
            Force Status Check
          </button>
        </div>
      </div>
      
      {statusCheckDebugInfo && (
        <div className="mt-8">
          <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
        </div>
      )}
    </>
  );
};

export default BridgeAwaitingDeposit;
