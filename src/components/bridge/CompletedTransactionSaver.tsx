import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";

interface CompletedTransactionSaverProps {
  orderDetails: OrderDetailsType;
  simulateSuccess: boolean;
  originalOrderDetails: OrderDetailsType | null;
  token: string;
  transactionSaved: boolean;
  setTransactionSaved: (saved: boolean) => void;
  statusCheckDebugInfo: any | null;
  onOrderDetailsUpdate: (updatedDetails: OrderDetailsType) => void;
}

export const CompletedTransactionSaver = ({
  orderDetails,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved,
  statusCheckDebugInfo,
  onOrderDetailsUpdate
}: CompletedTransactionSaverProps) => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Skip saving if simulateSuccess is true
    if (simulateSuccess) {
      console.log("Skipping transaction save due to simulateSuccess flag");
      return;
    }
    
    // Skip saving if the transaction is already marked as saved
    if (transactionSaved) {
      console.log("Transaction already saved, skipping save operation");
      return;
    }

    // Skip saving if we don't have order details or an order ID
    if (!orderDetails || !orderDetails.orderId) {
      console.warn("Cannot save transaction: missing order details or order ID");
      return;
    }
    
    // Skip saving if the order status is not 'completed'
    if (orderDetails.currentStatus !== 'completed') {
      console.log(`Transaction status is ${orderDetails.currentStatus}, skipping save operation`);
      return;
    }

    const saveTransaction = async () => {
      try {
        console.log("Attempting to save completed transaction to database");

        // Check if the transaction already exists in the database
        const { data: existingTransaction, error: selectError } = await supabase
          .from('completed_bridge_transactions')
          .select('*')
          .eq('ff_order_id', orderDetails.orderId)
          .limit(1);

        if (selectError) {
          console.error("Error checking for existing transaction:", selectError);
          toast({
            title: "Database Error",
            description: "Failed to check for existing transaction",
            variant: "destructive"
          });
          return;
        }

        if (existingTransaction && existingTransaction.length > 0) {
          console.log("Transaction already exists in database, skipping save");
          setTransactionSaved(true);
          return;
        }

        // Insert the transaction data into the database
        const { data, error } = await supabase
          .from('completed_bridge_transactions')
          .insert([
            {
              ff_order_id: orderDetails.orderId,
              ff_order_token: orderDetails.ffOrderToken,
              from_currency: orderDetails.fromCurrency,
              to_currency: orderDetails.toCurrency,
              amount: parseFloat(orderDetails.depositAmount),
              destination_address: orderDetails.destinationAddress,
              status: orderDetails.currentStatus,
              deposit_address: orderDetails.depositAddress,
              raw_api_response: orderDetails.rawApiResponse || null,
              client_metadata: {
                device: navigator.userAgent,
                simulation: simulateSuccess,
                time: new Date().toISOString()
              }
            }
          ])
          .select();

        if (error) {
          console.error("Error saving transaction:", error);
          toast({
            title: "Database Error",
            description: "Failed to save transaction",
            variant: "destructive"
          });
        } else {
          console.log("Transaction saved successfully:", data);
          setTransactionSaved(true);
          
          // Optionally, notify backend about the completed transaction
          try {
            // Fix the TypeScript error by adding a null check
            if (data && data.length > 0) {
              await supabase.functions.invoke('bridge-notify-complete', {
                body: {
                  transactionId: data[0].id,
                  metadata: {
                    source: 'CompletedTransactionSaver',
                    completionTime: new Date().toISOString()
                  }
                }
              });
            }
          } catch (notifyError) {
            console.error("Error notifying about completion:", notifyError);
            // Non-critical error, we don't need to show a toast
          }
          
          toast({
            title: "Transaction Saved",
            description: "Transaction details saved successfully",
          });
        }
      } catch (e) {
        console.error("Error saving transaction:", e);
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred while saving the transaction",
          variant: "destructive"
        });
      }
    };

    saveTransaction();
  }, [
    orderDetails,
    simulateSuccess,
    setTransactionSaved,
    transactionSaved
  ]);
  
  useEffect(() => {
    // If the order is expired, attempt to handle the expired status
    if (orderDetails?.currentStatus === 'expired') {
      handleExpiredStatus();
    }
  }, [orderDetails]);

  const handleExpiredStatus = async () => {
    console.log("Handling expired status");
    
    if (!orderDetails || !orderDetails.orderId || !token) {
      console.error("Cannot handle expired status: missing order details or token");
      return false;
    }

    try {
      console.log("Checking if transaction exists in database");
      
      // First check in completed_bridge_transactions
      const { data: completedResults, error: completedError } = await supabase
        .from('completed_bridge_transactions')
        .select('ff_order_id')
        .eq('ff_order_id', orderDetails.orderId)
        .limit(1);
      
      if (completedError) {
        console.error("Error checking for completed transaction:", completedError);
      } else if (completedResults && Array.isArray(completedResults) && completedResults.length > 0) {
        console.log("Completed transaction found in database:", completedResults);
        
        // If the transaction exists in the completed table, update the order details to mark it as completed
        if (onOrderDetailsUpdate) {
          console.log("Updating order details to show completed status");
          onOrderDetailsUpdate({
            ...orderDetails,
            currentStatus: "completed"
          });
        }
        
        // Return true to indicate the transaction was found and status was updated
        return true;
      }
      
      // Then check in bridge_transactions
      const { data: results, error } = await supabase
        .from('bridge_transactions')
        .select('ff_order_id, status')
        .eq('ff_order_id', orderDetails.orderId)
        .limit(1);
      
      if (error) {
        console.error("Error checking for transaction:", error);
        return false;
      }
      
      // Check if we found the transaction in the database and if it's marked as completed
      if (results && Array.isArray(results) && results.length > 0 && results[0].status === 'completed') {
        console.log("Completed transaction found in bridge_transactions:", results);
        
        // If the transaction exists and is completed, update the order details
        if (onOrderDetailsUpdate) {
          console.log("Updating order details to show completed status");
          onOrderDetailsUpdate({
            ...orderDetails,
            currentStatus: "completed"
          });
        }
        
        // Return true to indicate the transaction was found and status was updated
        return true;
      }
      
      console.log("Transaction not found in database or not marked as completed, will need to save it");
      return false;
    } catch (e) {
      console.error("Error in handleExpiredStatus:", e);
      return false;
    }
  };

  return null;
};
