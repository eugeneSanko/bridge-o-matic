
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

  // Function to check if a transaction exists in the database
  const checkTransactionExists = useCallback(async (orderId: string) => {
    if (!orderId) return false;
    
    console.log("Checking if transaction exists in database:", orderId);
    
    try {
      const { data: existingTransactions, error } = await supabase
        .from('completed_bridge_transactions')
        .select('id')
        .eq('ff_order_id', orderId)
        .limit(1);
      
      if (error) {
        console.error("Error checking for existing transaction:", error);
        return false;
      }
      
      return existingTransactions && existingTransactions.length > 0;
    } catch (err) {
      console.error("Exception checking transaction existence:", err);
      return false;
    }
  }, []);

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
      // Check if transaction is already in database
      const orderId = details.ffOrderId || details.orderId;
      console.log("Checking if transaction already exists:", orderId);
      
      const { data: existingTransactions, error: queryError } = await supabase
        .from('completed_bridge_transactions')
        .select('id')
        .eq('ff_order_id', orderId)
        .limit(1);
        
      if (queryError) {
        console.error("Error checking for existing transaction:", queryError);
      }
      
      // If transaction already exists, mark as saved and return
      if (existingTransactions && Array.isArray(existingTransactions) && existingTransactions.length > 0) {
        console.log("Transaction already exists in database, skipping save:", orderId);
        setTransactionSaved(true);
        return;
      }
      
      console.log("Transaction not found in database, saving:", orderId);
      console.log("Saving completed transaction to database", { 
        isSimulated, 
        orderDetails: details,
        apiResponse
      });
      
      // Convert non-serializable data to serializable format
      const languagesArray = Array.isArray(navigator.languages) ? navigator.languages : [];
      
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
        
        // Fix for TypeScript error - properly handle the data array type
        if (data && Array.isArray(data) && data.length > 0) {
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

  // Function to handle expired status
  const handleExpiredStatus = useCallback(async (orderDetails: OrderDetails) => {
    if (!orderDetails) return;
    
    const orderId = orderDetails.ffOrderId || orderDetails.orderId;
    if (!orderId) return;
    
    // Check if this order exists in completed_bridge_transactions
    const exists = await checkTransactionExists(orderId);
    
    if (exists) {
      console.log(`Order ${orderId} found in completed_bridge_transactions, updating status to completed`);
      // If it exists in the completed transactions, update the status to completed
      const updatedDetails = {
        ...orderDetails,
        currentStatus: "completed",
        rawApiResponse: {
          ...orderDetails.rawApiResponse,
          status: "DONE"
        }
      };
      
      // Return the updated order details
      return updatedDetails;
    }
    
    // If not found, leave as expired
    console.log(`Order ${orderId} not found in completed_bridge_transactions, keeping status as expired`);
    return null;
  }, [checkTransactionExists]);

  return { saveCompletedTransaction, handleExpiredStatus, checkTransactionExists };
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
  const { saveCompletedTransaction, handleExpiredStatus } = useCompletedTransactionSaver({
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
    
    // Handle expired status
    if (
      orderDetails && 
      orderDetails.rawApiResponse?.status === "EXPIRED"
    ) {
      handleExpiredStatus(orderDetails).then(updatedDetails => {
        if (updatedDetails) {
          console.log("Converting EXPIRED status to DONE as transaction was found in database");
          // If we got updated details back, the transaction was found in database
          saveCompletedTransaction(
            updatedDetails,
            { data: updatedDetails.rawApiResponse },
            false
          );
        }
      });
    }
  }, [
    simulateSuccess, 
    orderDetails, 
    originalOrderDetails, 
    transactionSaved, 
    saveCompletedTransaction,
    handleExpiredStatus
  ]);

  return null; // This is a logic-only component, no UI
};
