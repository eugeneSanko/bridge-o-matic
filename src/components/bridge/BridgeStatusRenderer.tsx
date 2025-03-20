
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { CompletedTransactionSaver } from "@/components/bridge/CompletedTransactionSaver";
import { useState, useEffect } from "react";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  setEmergencyActionTaken?: (taken: boolean) => void;
}

export const BridgeStatusRenderer = ({
  loading,
  error,
  orderDetails: initialOrderDetails,
  handleCopyAddress,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved,
  checkOrderStatus,
  setEmergencyActionTaken,
  statusCheckDebugInfo
}: BridgeStatusRendererProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(initialOrderDetails);
  const [uiReady, setUiReady] = useState(false);
  
  useEffect(() => {
    logger.debug("BridgeStatusRenderer: initialOrderDetails updated", initialOrderDetails);
    if (initialOrderDetails) {
      logger.debug("BridgeStatusRenderer: API response exists?", !!initialOrderDetails.rawApiResponse);
      if (initialOrderDetails.rawApiResponse) {
        logger.debug("BridgeStatusRenderer: API response data", JSON.stringify(initialOrderDetails.rawApiResponse, null, 2));
      } else {
        logger.warn("BridgeStatusRenderer: Missing rawApiResponse in orderDetails!");
        if (initialOrderDetails.currentStatus === "completed") {
          toast({
            title: "Warning",
            description: "Transaction is complete but API data is missing",
            variant: "destructive"
          });
        }
      }
    }
    setOrderDetails(initialOrderDetails);
    
    // Mark UI as ready after a short delay when order details are loaded
    const timer = setTimeout(() => {
      setUiReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initialOrderDetails]);
  
  // Show loading state while the page is loading or UI is not ready
  if (loading || !uiReady) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!orderDetails) {
    return <EmptyState />;
  }

  const handleOrderDetailsUpdate = (updatedDetails: OrderDetails) => {
    logger.debug("Updating order details:", updatedDetails);
    
    // Verify the raw API response is present
    if (!updatedDetails.rawApiResponse && updatedDetails.currentStatus === "completed") {
      logger.warn("Updated order details is missing rawApiResponse but status is completed!");
      toast({
        title: "Data Warning",
        description: "Updated order missing API data, may not save correctly",
        variant: "destructive"
      });
    }
    
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
      toast({
        title: "Processing",
        description: `Processing ${choice === "EXCHANGE" ? "exchange" : "refund"} request...`,
      });

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
        
        toast({
          title: "Success",
          description: choice === "EXCHANGE" 
            ? "Exchange will continue at current market rate" 
            : "Refund request has been processed",
        });
        
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

  logger.debug("BridgeStatusRenderer: Rendering with orderDetails", {
    id: orderDetails.orderId,
    status: orderDetails.currentStatus,
    hasApiResponse: !!orderDetails.rawApiResponse,
    responseKeys: orderDetails.rawApiResponse ? Object.keys(orderDetails.rawApiResponse) : []
  });

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
      />
    </>
  );
};
