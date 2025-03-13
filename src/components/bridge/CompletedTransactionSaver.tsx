
import { useEffect, useCallback } from "react";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

    try {
      console.log("Saving completed transaction to database", { isSimulated });
      
      // Convert non-serializable data to serializable format
      const languagesArray = Array.from(navigator.languages || []);
      
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
              original_status: originalDetails?.rawApiResponse?.status
            }
          : apiResponse.data,
        client_metadata: {
          device: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ip: null, // Will be filled server-side
          simulation: isSimulated,
          user_agent: navigator.userAgent,
          languages: languagesArray,
          debug_info: statusCheckDebugInfo
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
      
      // Optionally redirect to a completion page
      setTimeout(() => {
        navigate(`/bridge/complete?orderId=${details.orderId}`);
      }, 2000);
      
    } catch (err) {
      console.error("Exception saving transaction:", err);
    }
  }, [token, statusCheckDebugInfo, setTransactionSaved, navigate]);

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
  }, [
    simulateSuccess, 
    orderDetails, 
    originalOrderDetails, 
    transactionSaved, 
    saveCompletedTransaction
  ]);

  return null; // This is a logic-only component, no UI
};
