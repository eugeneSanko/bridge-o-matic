
import { useEffect, useState } from "react";
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
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Add effect to check for expired status first before other effects run
  useEffect(() => {
    // If the order is expired, immediately check the database
    if (orderDetails?.currentStatus === 'expired' || orderDetails?.rawApiResponse?.status === 'EXPIRED') {
      checkCompletedTransactionInDb();
    }
  }, [orderDetails?.currentStatus, orderDetails?.rawApiResponse?.status]);

  const checkCompletedTransactionInDb = async () => {
    if (!orderDetails || !orderDetails.orderId) {
      logger.error("Cannot check database: missing order details or order ID");
      return false;
    }

    try {
      // Set checking state to true
      setIsCheckingDb(true);
      logger.info("Checking if transaction exists in database for expired order", orderDetails.orderId);
      
      // Query the database to see if this transaction was already processed
      const { data: results, error } = await supabase
        .from('bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderDetails.orderId)
        .limit(1);
      
      if (error) {
        logger.error("Error checking for transaction:", error);
        setIsCheckingDb(false);
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
          
          // Mark as transaction saved since we found it in the database
          setTransactionSaved(true);
          
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
            
            logger.debug("Updated order details from DB:", updatedDetails);
            onOrderDetailsUpdate(updatedDetails);
          }
          
          setIsCheckingDb(false);
          return true;
        } else {
          logger.debug("Transaction found in database but status is not completed:", results[0].status);
        }
      } else {
        logger.debug("Transaction not found in database, will need to save it if it completes");
      }
      
      setIsCheckingDb(false);
      return false;
    } catch (e) {
      logger.error("Error checking database:", e);
      setIsCheckingDb(false);
      return false;
    }
  };

  useEffect(() => {
    // Skip if we're currently checking the database
    if (isCheckingDb) {
      return;
    }

    // Log the current order details to help debug
    logger.debug("CompletedTransactionSaver: Current orderDetails", {
      orderId: orderDetails?.orderId,
      status: orderDetails?.currentStatus,
      apiStatus: orderDetails?.rawApiResponse?.status,
      transactionSaved,
      hasApiResponse: !!orderDetails?.rawApiResponse,
      responseKeys: orderDetails?.rawApiResponse ? Object.keys(orderDetails.rawApiResponse) : []
    });
    
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

    // Check if raw API response exists
    if (!orderDetails.rawApiResponse) {
      logger.warn("Missing raw API response, cannot save transaction properly");
      toast({
        title: "Warning",
        description: "Missing API data for transaction, can't save completely",
        variant: "destructive"
      });
      return;
    }

    const saveTransaction = async () => {
      try {
        // Show toast when starting to save
        toast({
          title: "Saving Transaction",
          description: "Attempting to save your transaction details..."
        });

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
          toast({
            title: "Already Saved",
            description: "This transaction was already saved to the database"
          });
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

        // Ensure we have the raw API response - no default empty object!
        if (!orderDetails.rawApiResponse) {
          toast({
            title: "Missing Data",
            description: "Raw API response is missing, transaction will be incomplete",
            variant: "destructive"
          });
          logger.error("Raw API response is missing or null!");
          return;
        }
        
        const rawApiResponse = orderDetails.rawApiResponse;
        
        logger.debug("Raw API response being saved:", JSON.stringify(rawApiResponse, null, 2));
        
        // Log the exact data we're about to insert
        const insertData = {
          ff_order_id: orderDetails.orderId,
          ff_order_token: orderDetails.ffOrderToken || token,
          from_currency: orderDetails.fromCurrency,
          to_currency: orderDetails.toCurrency,
          amount: parseFloat(orderDetails.depositAmount) || 0,
          destination_address: orderDetails.destinationAddress,
          status: 'completed',
          deposit_address: orderDetails.depositAddress,
          client_metadata: clientMetadata,
          initial_rate: 0, // You might want to replace this with the actual rate
          expiration_time: orderDetails.expiresAt || new Date().toISOString(),
          raw_api_response: rawApiResponse  // Important: No default fallback here
        };
        
        logger.debug("Database insert data:", JSON.stringify(insertData, null, 2));

        // Use a more reliable approach with error handling
        try {
          // Insert the transaction data into the database
          const { data, error } = await supabase
            .from('bridge_transactions')
            .insert(insertData)
            .select('id, raw_api_response');

          if (error) {
            // Handle duplicate key errors gracefully
            if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
              logger.info("Transaction already exists in database (constraint violation)");
              setTransactionSaved(true);
              toast({
                title: "Already Saved",
                description: "This transaction was already saved to the database"
              });
            } else {
              logger.error("Database error details:", error);
              toast({
                title: "Save Error",
                description: `Failed to save transaction: ${error.message}`,
                variant: "destructive"
              });
              throw error;
            }
          } else {
            logger.info("Transaction saved successfully:", data);
            
            // Log what was actually saved to the database
            if (data && data.length > 0) {
              const savedResponse = data[0].raw_api_response;
              logger.debug("Raw API response as saved in DB:", savedResponse);
              
              if (!savedResponse || (typeof savedResponse === 'object' && Object.keys(savedResponse).length === 0)) {
                toast({
                  title: "Partial Save",
                  description: "Transaction saved but API data was not stored correctly",
                  variant: "destructive"
                });
              } else {
                toast({
                  title: "Transaction Saved",
                  description: "Transaction details saved successfully with API data"
                });
              }
            } else {
              toast({
                title: "Transaction Saved",
                description: "Transaction saved, but couldn't verify API data"
              });
            }
            
            setTransactionSaved(true);
          }
        } catch (dbError) {
          logger.error("Database error saving transaction:", dbError);
          toast({
            title: "Database Error",
            description: `Failed to save transaction: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      } catch (e) {
        logger.error("Error saving transaction:", e);
        toast({
          title: "Unexpected Error",
          description: `An unexpected error occurred: ${e instanceof Error ? e.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    };

    saveTransaction();
  }, [
    orderDetails,
    simulateSuccess,
    setTransactionSaved,
    transactionSaved,
    token,
    isCheckingDb
  ]);

  return null;
};
