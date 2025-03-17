
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { DebugInfoDisplay } from "@/components/bridge/DebugInfoDisplay";
import { CompletedTransactionSaver } from "@/components/bridge/CompletedTransactionSaver";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

export const BridgeStatusRenderer = ({
  loading,
  error,
  orderDetails: initialOrderDetails,
  handleCopyAddress,
  statusCheckDebugInfo,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved,
  checkOrderStatus
}: BridgeStatusRendererProps) => {
  // Add state to handle updated orderDetails after expired status check
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(initialOrderDetails);
  
  // Update local orderDetails when initial orderDetails changes
  useEffect(() => {
    setOrderDetails(initialOrderDetails);
  }, [initialOrderDetails]);
  
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <>
        <ErrorState error={error} />
        <DebugInfoDisplay 
          statusCheckDebugInfo={statusCheckDebugInfo} 
          error={error}
          orderDetails={null}
        />
      </>
    );
  }

  if (!orderDetails) {
    return (
      <>
        <EmptyState />
        <DebugInfoDisplay 
          statusCheckDebugInfo={statusCheckDebugInfo} 
          error={null}
          orderDetails={null}
        />
      </>
    );
  }

  // Function to update order details (used by CompletedTransactionSaver)
  const handleOrderDetailsUpdate = (updatedDetails: OrderDetails) => {
    console.log("Updating order details:", updatedDetails);
    setOrderDetails(updatedDetails);
  };

  // Handlers for emergency actions
  const handleEmergencyAction = async (choice: "EXCHANGE" | "REFUND") => {
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

      const { data, error } = await supabase.functions.invoke("bridge-status", {
        body: {
          id: orderDetails.ffOrderId,
          token: token,
          action: "emergency",
          choice: choice,
        },
      });

      console.log("Emergency action response:", data);

      if (error) {
        console.error("Error in emergency action:", error);
        toast({
          title: "Error",
          description: `Failed to process ${choice.toLowerCase()}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.code === 0) {
        toast({
          title: "Success",
          description: choice === "EXCHANGE" 
            ? "Exchange will continue at current market rate" 
            : "Refund request has been processed",
        });
        
        // Refresh order status to get updated information
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
      console.error("Exception in emergency action:", err);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handlers for new actions
  const handleRetryCurrentPrice = () => {
    console.log("Retrying at current price");
    if (checkOrderStatus) {
      checkOrderStatus();
    }
  };

  const handleEmergencyExchange = () => {
    console.log("Emergency exchange requested");
    handleEmergencyAction("EXCHANGE");
  };

  const handleEmergencyRefund = () => {
    console.log("Emergency refund requested");
    handleEmergencyAction("REFUND");
  };

  return (
    <>
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleCopyAddress} 
        onRetryCurrentPrice={handleRetryCurrentPrice}
        onEmergencyExchange={handleEmergencyExchange}
        onEmergencyRefund={handleEmergencyRefund}
      />
      
      <DebugInfoDisplay 
        statusCheckDebugInfo={statusCheckDebugInfo} 
        error={null}
        orderDetails={orderDetails}
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
