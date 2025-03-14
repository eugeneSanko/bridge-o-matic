
import { useEffect, useCallback } from "react";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

interface CompletedTransactionSaverProps {
  orderDetails: OrderDetails | null;
  simulateSuccess: boolean;
  originalOrderDetails: OrderDetails | null;
  token: string;
  transactionSaved: boolean;
  setTransactionSaved: (saved: boolean) => void;
  statusCheckDebugInfo: any | null;
}

export const useCompletedTransactionSaver = ({
  token,
  statusCheckDebugInfo,
  setTransactionSaved
}: Pick<CompletedTransactionSaverProps, 'token' | 'statusCheckDebugInfo' | 'setTransactionSaved'>) => {
  const navigate = useNavigate();

  // Function to save completed transaction to Supabase
  const saveCompletedTransaction = useCallback(async (
    details: OrderDetails, 
    apiResponse: any, 
    isSimulated: boolean,
    originalDetails?: OrderDetails | null
  ) => {
    if (!details) return;
    
    // Skip saving if the ID is "M14W2G"
    if (details.ffOrderId === "M14W2G" || details.orderId === "M14W2G") {
      console.log("Skipping transaction save for test ID M14W2G");
      setTransactionSaved(true);
      return;
    }

    try {
      console.log("Saving completed transaction to database", { 
        isSimulated, 
        orderDetails: details,
        apiResponse
      });
      
      // Convert non-serializable data to serializable format
      const languagesArray = Array.from(navigator.languages || []);
      
      // Prepare device information
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      };
      
      // Prepare transaction data
      const transactionData = {
        ff_order_id: details.ffOrderId || details.orderId,
        ff_order_token: details.ffOrderToken || token,
        from_currency: details.fromCurrency,
        to_currency: details.toCurrency,
        amount: parseFloat(details.depositAmount),
        destination_address: details.destinationAddress,
        deposit_address: details.depositAddress,
        status: "completed",
        raw_api_response: isSimulated 
          ? { 
              ...apiResponse.data,
              simulated: true,
              original_status: originalDetails?.rawApiResponse?.status,
              simulatedAt: new Date().toISOString()
            }
          : apiResponse.data,
        client_metadata: {
          device: deviceInfo,
          timestamp: new Date().toISOString(),
          ip: null, // Will be filled server-side
          simulation: isSimulated,
          user_agent: navigator.userAgent,
          languages: languagesArray,
          debug_info: statusCheckDebugInfo,
          browser: {
            cookiesEnabled: navigator.cookieEnabled,
            language: navigator.language,
            doNotTrack: navigator.doNotTrack
          },
          window: {
            location: window.location.href,
            referrer: document.referrer,
            localStorage: typeof localStorage !== 'undefined'
          }
        }
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('completed_bridge_transactions')
        .insert(transactionData);

      if (error) {
        console.error("Error saving completed transaction:", error);
        toast({
          title: "Database Error",
          description: "Could not save transaction data",
          variant: "destructive"
        });
        return;
      }

      console.log("Transaction saved successfully:", data);
      setTransactionSaved(true);
      
      toast({
        title: "Transaction Recorded",
        description: "Transaction has been saved to database",
        variant: "default"
      });
      
      // Send completion notification to backend
      try {
        // Create a type-safe way to extract the transaction ID
        // We need to handle the case where data might be null or not have the expected structure
        let transactionId = 'unknown';
        
        if (data && Array.isArray(data)) {
          // If it's a valid array with at least one element that has an id property
          const firstRecord = data[0] as { id?: string } | undefined;
          if (firstRecord && 'id' in firstRecord) {
            transactionId = firstRecord.id || 'unknown';
          }
        }
        
        const notifyResponse = await supabase.functions.invoke('bridge-notify-complete', {
          body: { 
            transactionId: transactionId,
            metadata: {
              fromCurrency: details.fromCurrency,
              toCurrency: details.toCurrency,
              timestamp: new Date().toISOString(),
              isSimulated
            }
          }
        });
        
        console.log("Completion notification sent:", notifyResponse);
      } catch (notifyError) {
        console.error("Failed to send completion notification:", notifyError);
      }
      
      // Removed navigation to completion page
      
    } catch (err) {
      console.error("Exception saving transaction:", err);
    }
  }, [token, statusCheckDebugInfo, setTransactionSaved]);

  return { saveCompletedTransaction };
};

export const CompletedTransactionSaver = ({
  orderDetails,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved,
  statusCheckDebugInfo
}: CompletedTransactionSaverProps) => {
  const { saveCompletedTransaction } = useCompletedTransactionSaver({
    token,
    statusCheckDebugInfo,
    setTransactionSaved
  });

  // Effect to monitor completion status and save to database
  useEffect(() => {
    // Check if order is completed via simulation
    if (
      simulateSuccess && 
      orderDetails && 
      orderDetails.currentStatus === "completed" && 
      orderDetails.rawApiResponse?.status === "DONE" && 
      !transactionSaved
    ) {
      // Save simulated completed transaction
      saveCompletedTransaction(
        orderDetails, 
        { data: orderDetails.rawApiResponse }, 
        true,
        originalOrderDetails
      );
    }
    
    // Check if order is completed via API status
    if (
      !simulateSuccess &&
      orderDetails && 
      orderDetails.currentStatus === "completed" && 
      orderDetails.rawApiResponse?.status === "DONE" && 
      !transactionSaved
    ) {
      // Save real completed transaction
      saveCompletedTransaction(
        orderDetails, 
        { data: orderDetails.rawApiResponse }, 
        false
      );
    }
  }, [
    simulateSuccess, 
    orderDetails, 
    originalOrderDetails, 
    transactionSaved, 
    saveCompletedTransaction
  ]);

  return null; // This is a logic-only component, no UI
};
