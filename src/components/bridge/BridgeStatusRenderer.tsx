
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { CompletedTransactionSaver } from "@/components/bridge/CompletedTransactionSaver";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface BridgeStatusRendererProps {
  loading: boolean;
  error: string | null;
  orderDetails: OrderDetails | null;
  handleCopyAddress: (address: string) => void;
  statusCheckDebugInfo: any | null;
  simulateSuccess: boolean;
  originalOrderDetails: OrderDetails | null;
  token: string;
  transactionSaved: boolean;
  setTransactionSaved: (saved: boolean) => void;
  checkOrderStatus?: () => void;
  checkDbForCompletedTransaction?: (orderId: string) => Promise<any>;
  setEmergencyActionTaken?: (taken: boolean) => void;
}

export const BridgeStatusRenderer = ({
  loading: initialLoading,
  error,
  orderDetails: initialOrderDetails,
  handleCopyAddress,
  statusCheckDebugInfo,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved,
  checkOrderStatus,
  checkDbForCompletedTransaction,
  setEmergencyActionTaken
}: BridgeStatusRendererProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(initialOrderDetails);
  const [checkingDbForExpiredOrder, setCheckingDbForExpiredOrder] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  
  // Track whether we've already checked this expired order
  const hasCheckedExpiredOrderRef = useRef<string | null>(null);
  
  // Reset the loading state after a timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (checkingDbForExpiredOrder) {
      // Safety timeout - if DB check takes too long, force reset the loading state
      timeoutId = window.setTimeout(() => {
        logger.warn("Database check timeout exceeded, forcing reset of loading state");
        setCheckingDbForExpiredOrder(false);
        setLoading(false);
      }, 5000); // 5 second timeout as a safety measure
    }
    
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [checkingDbForExpiredOrder]);
  
  // Handle new order details from parent component
  useEffect(() => {
    setOrderDetails(initialOrderDetails);
    setLoading(initialLoading);
    
    // Only check database if:
    // 1. This is an expired order
    // 2. We haven't checked this exact order ID yet
    // 3. We have a DB checking function available
    const isExpiredOrder = initialOrderDetails?.currentStatus === 'expired' || 
                          initialOrderDetails?.rawApiResponse?.status === 'EXPIRED';
    
    const shouldCheckDB = isExpiredOrder && 
                         hasCheckedExpiredOrderRef.current !== initialOrderDetails?.orderId &&
                         !!checkDbForCompletedTransaction;
    
    if (shouldCheckDB && initialOrderDetails) {
      logger.debug("Setting up DB check for expired order", initialOrderDetails.orderId);
      setCheckingDbForExpiredOrder(true);
      hasCheckedExpiredOrderRef.current = initialOrderDetails.orderId;
      
      // Start the database check when needed
      const startDbCheck = async () => {
        if (checkDbForCompletedTransaction && initialOrderDetails?.orderId) {
          logger.info("Checking database for completed transaction for expired order");
          const dbTransaction = await checkDbForCompletedTransaction(initialOrderDetails.orderId);
          
          if (dbTransaction) {
            logger.info("Found completed transaction in database for expired order");
            
            // Create updated order details with data from the database
            const updatedDetails: OrderDetails = {
              ...initialOrderDetails,
              currentStatus: "completed",
              rawApiResponse: dbTransaction.raw_api_response || initialOrderDetails.rawApiResponse
            };
            
            handleOrderDetailsUpdate(updatedDetails);
          }
          
          // Always reset loading state after check completes
          setCheckingDbForExpiredOrder(false);
          setLoading(false);
        }
      };
      
      startDbCheck();
    }
  }, [initialOrderDetails, initialLoading, checkDbForCompletedTransaction]);
  
  // If we're in a loading state or checking DB for expired orders, show loading state
  if (loading || checkingDbForExpiredOrder) {
    logger.debug("Rendering loading state - loading:", loading, "checking DB:", checkingDbForExpiredOrder);
    return <LoadingState message={checkingDbForExpiredOrder ? "Checking transaction records in the database..." : "Verifying transaction status..."} />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!orderDetails) {
    return <EmptyState />;
  }

  const handleOrderDetailsUpdate = (updatedDetails: OrderDetails) => {
    logger.debug("Updating order details:", updatedDetails);
    setOrderDetails(updatedDetails);
  };

  const handleEmergencyAction = async (choice: "EXCHANGE" | "REFUND", refundAddress?: string) => {
    if (!orderDetails || !orderDetails.ffOrderId || !token) {
      toast({
        title: "Error",
        description: "Missing order information for emergency action",
        variant: "destructive",
      });
      return;
    }

    try {
      logger.info(`Processing ${choice.toLowerCase()} request...`);

      const requestBody: any = {
        id: orderDetails.ffOrderId,
        token: token,
        choice: choice,
      };

      if (choice === "REFUND" && refundAddress) {
        requestBody.address = refundAddress;
      }

      const { data, error } = await supabase.functions.invoke("bridge-emergency", {
        body: requestBody,
      });

      logger.debug("Emergency action response:", data);

      if (error) {
        logger.error("Error in emergency action:", error);
        toast({
          title: "Error",
          description: `Failed to process ${choice.toLowerCase()}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.code === 0) {
        const emergencyEvent = new Event("emergency-action-triggered");
        window.dispatchEvent(emergencyEvent);
        
        if (setEmergencyActionTaken) {
          logger.debug("Setting emergency action taken flag");
          setEmergencyActionTaken(true);
        }
        
        if (checkOrderStatus) {
          setTimeout(() => {
            checkOrderStatus();
          }, 2000);
        }
      } else {
        toast({
          title: "API Error",
          description: data?.msg || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Exception in emergency action:", err);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleRetryCurrentPrice = () => {
    logger.debug("Retrying at current price");
    if (checkOrderStatus) {
      checkOrderStatus();
    }
  };

  const handleEmergencyExchange = () => {
    logger.debug("Emergency exchange requested");
    handleEmergencyAction("EXCHANGE");
  };

  const handleEmergencyRefund = (refundAddress?: string) => {
    logger.debug("Emergency refund requested with address:", refundAddress);
    handleEmergencyAction("REFUND", refundAddress);
  };

  const handleAddressCopy = (address: string) => {
    handleCopyAddress(address);
  };

  logger.debug("Rendering transaction details for status:", orderDetails.currentStatus);
  
  return (
    <>
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleAddressCopy} 
        onRetryCurrentPrice={handleRetryCurrentPrice}
        onEmergencyExchange={handleEmergencyExchange}
        onEmergencyRefund={handleEmergencyRefund}
      />
      
      <CompletedTransactionSaver
        orderDetails={orderDetails}
        simulateSuccess={simulateSuccess}
        originalOrderDetails={originalOrderDetails}
        token={token}
        transactionSaved={transactionSaved}
        setTransactionSaved={setTransactionSaved}
        statusCheckDebugInfo={statusCheckDebugInfo}
        onOrderDetailsUpdate={handleOrderDetailsUpdate}
        setCheckingDb={setCheckingDbForExpiredOrder}
        hasCheckedExpiredOrderRef={hasCheckedExpiredOrderRef}
      />
    </>
  );
};
