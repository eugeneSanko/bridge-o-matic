
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

    // Show toast to indicate we're starting the save process
    toast({
      title: "Saving Transaction",
      description: "Attempting to save your transaction details..."
    });

    // Check if raw API response exists
    if (!orderDetails.rawApiResponse) {
      logger.warn("Missing raw API response, cannot save transaction properly");
      toast({
        title: "Warning",
        description: "Missing API data for transaction, constructing fallback data",
        variant: "destructive"
      });
    }

    const saveTransaction = async () => {
      try {
        logger.info("Attempting to save completed transaction to database");
        
        // Create a standardized API response structure if missing
        let rawApiResponse = orderDetails.rawApiResponse;
        
        if (!rawApiResponse || Object.keys(rawApiResponse).length === 0) {
          logger.warn("Creating fallback API response structure");
          
          // Create a properly structured fallback API response
          rawApiResponse = {
            id: orderDetails.orderId || "UNKNOWN",
            type: orderDetails.orderType || "float",
            status: "DONE",
            time: {
              reg: Math.floor(Date.now() / 1000) - 3600,
              start: Math.floor(Date.now() / 1000) - 3000,
              finish: Math.floor(Date.now() / 1000),
              update: Math.floor(Date.now() / 1000),
              expiration: orderDetails.expiresAt ? Math.floor(new Date(orderDetails.expiresAt).getTime() / 1000) : (Math.floor(Date.now() / 1000) + 1800),
              left: 0,
            },
            from: {
              code: orderDetails.fromCurrency || "UNKNOWN",
              coin: orderDetails.fromCurrency || "UNKNOWN",
              network: "UNKNOWN",
              name: orderDetails.fromCurrencyName || "Unknown Currency",
              alias: orderDetails.fromCurrency?.toLowerCase() || "unknown",
              amount: orderDetails.depositAmount || "0.00000000",
              address: orderDetails.depositAddress || "UNKNOWN",
              addressAlt: null,
              tag: orderDetails.tag || null,
              tagName: orderDetails.tagName || null,
              reqConfirmations: 1,
              maxConfirmations: 6,
              tx: {
                id: null,
                amount: null,
                fee: null,
                ccyfee: null,
                timeReg: null,
                timeBlock: null,
                confirmations: null,
              },
            },
            to: {
              code: orderDetails.toCurrency || "UNKNOWN",
              coin: orderDetails.toCurrency || "UNKNOWN",
              network: "UNKNOWN",
              name: orderDetails.toCurrencyName || "Unknown Currency",
              alias: orderDetails.toCurrency?.toLowerCase() || "unknown",
              amount: orderDetails.receiveAmount || "0.00000000",
              address: orderDetails.destinationAddress || "UNKNOWN",
              tag: null,
              tagName: null,
              tx: {
                id: null,
                amount: null,
                fee: null,
                ccyfee: null,
                timeReg: null,
                timeBlock: null,
                confirmations: null,
              },
            },
            token: orderDetails.ffOrderToken || token,
          };
          
          logger.debug("Created fallback API structure:", rawApiResponse);
        }

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

        // Collect client metadata with better formatting
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
          simulation: simulateSuccess,
          timestamp: new Date().toISOString()
        };
        
        logger.debug("Client metadata for saving:", clientMetadata);
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
          raw_api_response: rawApiResponse  // Use the properly structured API response
        };
        
        logger.debug("Database insert data:", JSON.stringify(insertData, null, 2));

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
          }
        } else {
          logger.info("Transaction saved successfully:", data);
          
          // Verify what was actually saved
          if (data && data.length > 0) {
            const savedResponse = data[0].raw_api_response;
            logger.debug("Raw API response as saved in DB:", typeof savedResponse, savedResponse);
            
            if (!savedResponse || (typeof savedResponse === 'object' && Object.keys(savedResponse).length === 0)) {
              toast({
                title: "Partial Save",
                description: "Transaction saved but API data appears empty in database",
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
        
        // Double check the saved transaction
        setTimeout(async () => {
          const { data: verifyData, error: verifyError } = await supabase
            .from('bridge_transactions')
            .select('raw_api_response')
            .eq('ff_order_id', orderDetails.orderId)
            .limit(1);
            
          if (verifyError) {
            logger.error("Error verifying saved transaction:", verifyError);
          } else if (verifyData && verifyData.length > 0) {
            logger.debug("Verification of saved transaction:", {
              hasData: !!verifyData[0].raw_api_response,
              dataType: typeof verifyData[0].raw_api_response,
              isEmpty: typeof verifyData[0].raw_api_response === 'object' && 
                     Object.keys(verifyData[0].raw_api_response).length === 0
            });
          }
        }, 2000);
        
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
    token
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
