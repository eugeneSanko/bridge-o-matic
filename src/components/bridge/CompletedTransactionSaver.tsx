
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";
import { logger } from "@/utils/logger";

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
      logger.debug("Skipping transaction save due to simulateSuccess flag");
      return;
    }
    
    // Skip saving if the transaction is already marked as saved
    if (transactionSaved) {
      logger.debug("Transaction already saved, skipping save operation");
      return;
    }

    // Skip saving if we don't have order details or an order ID
    if (!orderDetails || !orderDetails.orderId) {
      logger.warn("Cannot save transaction: missing order details or order ID");
      return;
    }
    
    // Skip saving if the order status is not 'completed'
    if (orderDetails.currentStatus !== 'completed') {
      logger.debug(`Transaction status is ${orderDetails.currentStatus}, skipping save operation`);
      return;
    }

    const saveTransaction = async () => {
      try {
        logger.info("Attempting to save completed transaction to database");

        // Check if the transaction already exists in the database
        const { data: existingTransaction, error: selectError } = await supabase
          .from('bridge_transactions')
          .select('*')
          .eq('ff_order_id', orderDetails.orderId);

        if (selectError) {
          logger.error("Error checking for existing transaction:", selectError);
          toast({
            title: "Database Error",
            description: "Failed to check for existing transaction",
            variant: "destructive"
          });
          return;
        }

        if (existingTransaction && existingTransaction.length > 0) {
          logger.info("Transaction already exists in database, skipping save");
          setTransactionSaved(true);
          return;
        }

        // Collect client metadata - convert readonly array to regular array
        const clientMetadata = {
          ip: 'client-side',
          user_agent: navigator.userAgent,
          languages: Array.from(navigator.languages || [navigator.language]),
          device: {
            width: window.innerWidth,
            height: window.innerHeight,
            platform: navigator.platform,
            vendor: navigator.vendor
          },
          simulation: simulateSuccess
        };

        // Insert the transaction data into the database - pass a single object, not an array
        const { data, error } = await supabase
          .from('bridge_transactions')
          .insert({
            ff_order_id: orderDetails.orderId,
            ff_order_token: orderDetails.ffOrderToken,
            from_currency: orderDetails.fromCurrency,
            to_currency: orderDetails.toCurrency,
            amount: parseFloat(orderDetails.depositAmount),
            destination_address: orderDetails.destinationAddress,
            status: orderDetails.currentStatus,
            deposit_address: orderDetails.depositAddress,
            client_metadata: clientMetadata,
            initial_rate: 0, // You might want to replace this with the actual rate
            expiration_time: orderDetails.expiresAt || new Date().toISOString(),
          });

        if (error) {
          logger.error("Error saving transaction:", error);
          toast({
            title: "Database Error",
            description: "Failed to save transaction",
            variant: "destructive"
          });
        } else {
          logger.info("Transaction saved successfully:", data);
          setTransactionSaved(true);
          toast({
            title: "Transaction Saved",
            description: "Transaction details saved successfully",
          });
        }
      } catch (e) {
        logger.error("Error saving transaction:", e);
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

  // This fixes the TypeScript error by properly checking if results.data is an array with length
  const handleExpiredStatus = async () => {
    logger.info("Handling expired status");
    
    if (!orderDetails || !orderDetails.orderId || !token) {
      logger.error("Cannot handle expired status: missing order details or token");
      return false;
    }

    try {
      logger.debug("Checking if transaction exists in database");
      
      // Query the database to see if this transaction was already processed
      const { data: results, error } = await supabase
        .from('bridge_transactions')
        .select('ff_order_id')
        .eq('ff_order_id', orderDetails.orderId)
        .limit(1);
      
      if (error) {
        logger.error("Error checking for transaction:", error);
        return false;
      }
      
      // Check if we found the transaction in the database
      if (results && Array.isArray(results) && results.length > 0) {
        logger.debug("Transaction found in database:", results);
        
        // If the transaction exists in the database, update the order details to mark it as completed
        if (onOrderDetailsUpdate) {
          logger.info("Updating order details to show completed status");
          onOrderDetailsUpdate({
            ...orderDetails,
            currentStatus: "completed"
          });
        }
        
        // Return true to indicate the transaction was found and status was updated
        return true;
      }
      
      logger.debug("Transaction not found in database, will need to save it");
      return false;
    } catch (e) {
      logger.error("Error in handleExpiredStatus:", e);
      return false;
    }
  };

  return null;
};
