
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
    
    // Only save if the order status is 'DONE' or 'completed'
    const apiStatus = orderDetails.rawApiResponse?.status;
    if (apiStatus !== 'DONE' && orderDetails.currentStatus !== 'completed') {
      logger.debug(`Transaction status is ${orderDetails.currentStatus} (API: ${apiStatus}), skipping save operation`);
      return;
    }

    const saveTransaction = async () => {
      try {
        logger.info("Attempting to save completed transaction to database");
        logger.debug("Order details for saving:", JSON.stringify(orderDetails, null, 2));

        // Check if the transaction already exists in the database
        const { data: existingTransaction, error: selectError } = await supabase
          .from('bridge_transactions')
          .select('id')
          .eq('ff_order_id', orderDetails.orderId)
          .limit(1);

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
          logger.info("Transaction already exists in database, updating saved state");
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

        // Ensure we have the raw API response
        const rawApiResponse = orderDetails.rawApiResponse || {};
        
        logger.debug("Raw API response being saved:", JSON.stringify(rawApiResponse, null, 2));

        // Use a more reliable approach with error handling
        try {
          // Insert the transaction data into the database
          const { data, error } = await supabase
            .from('bridge_transactions')
            .insert({
              ff_order_id: orderDetails.orderId,
              ff_order_token: orderDetails.ffOrderToken,
              from_currency: orderDetails.fromCurrency,
              to_currency: orderDetails.toCurrency,
              amount: parseFloat(orderDetails.depositAmount),
              destination_address: orderDetails.destinationAddress,
              status: 'completed',
              deposit_address: orderDetails.depositAddress,
              client_metadata: clientMetadata,
              initial_rate: 0, // You might want to replace this with the actual rate
              expiration_time: orderDetails.expiresAt || new Date().toISOString(),
              raw_api_response: rawApiResponse
            })
            .select('id');

          if (error) {
            // Handle duplicate key errors gracefully
            if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
              logger.info("Transaction already exists in database (constraint violation)");
              setTransactionSaved(true);
            } else {
              throw error;
            }
          } else {
            logger.info("Transaction saved successfully:", data);
            setTransactionSaved(true);
            // toast({
            //   title: "Transaction Saved",
            //   description: "Transaction details saved successfully",
            // });
          }
        } catch (dbError) {
          logger.error("Database error saving transaction:", dbError);
          toast({
            title: "Database Error",
            description: "Failed to save transaction",
            variant: "destructive"
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
    if (orderDetails?.currentStatus === 'expired' || orderDetails?.rawApiResponse?.status === 'EXPIRED') {
      handleExpiredStatus();
    }
  }, [orderDetails]);

  const handleExpiredStatus = async () => {
    logger.info("Handling expired status");
    
    if (!orderDetails || !orderDetails.orderId) {
      logger.error("Cannot handle expired status: missing order details or order ID");
      return false;
    }

    try {
      logger.debug("Checking if transaction exists in database");
      
      // Query the database to see if this transaction was already processed
      const { data: results, error } = await supabase
        .from('bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderDetails.orderId)
        .limit(1);
      
      if (error) {
        logger.error("Error checking for transaction:", error);
        return false;
      }
      
      // Check if we found the transaction in the database
      if (results && Array.isArray(results) && results.length > 0) {
        logger.debug("Transaction found in database:", results);
        
        // If the transaction exists in the database and status is completed, update the order details
        if (results[0].status === 'completed') {
          logger.info("Found completed transaction in database, updating order details");
          
          // Get the raw API response from the database
          const savedApiResponse = results[0].raw_api_response || {};
          logger.debug("Saved API response:", savedApiResponse);
          
          // Reconstruct the order details from the database record
          if (onOrderDetailsUpdate) {
            const updatedDetails = {
              ...orderDetails,
              currentStatus: "completed",
              depositAddress: results[0].deposit_address || orderDetails.depositAddress,
              depositAmount: results[0].amount?.toString() || orderDetails.depositAmount,
              fromCurrency: results[0].from_currency || orderDetails.fromCurrency,
              toCurrency: results[0].to_currency || orderDetails.toCurrency,
              destinationAddress: results[0].destination_address || orderDetails.destinationAddress,
              rawApiResponse: savedApiResponse
            };
            
            logger.debug("Updated order details:", updatedDetails);
            onOrderDetailsUpdate(updatedDetails);
          }
          
          // Return true to indicate the transaction was found and status was updated
          return true;
        } else {
          logger.debug("Transaction found in database but status is not completed:", results[0].status);
        }
      } else {
        logger.debug("Transaction not found in database, will need to save it if it completes");
      }
      
      return false;
    } catch (e) {
      logger.error("Error in handleExpiredStatus:", e);
      return false;
    }
  };

  return null;
};
