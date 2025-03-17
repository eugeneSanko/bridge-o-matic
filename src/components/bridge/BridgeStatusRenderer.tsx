
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { DebugInfoDisplay } from "@/components/bridge/DebugInfoDisplay";
import { CompletedTransactionSaver } from "@/components/bridge/CompletedTransactionSaver";
import { useState, useEffect } from "react";

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
  onEmergencyExchange?: () => void;
  onEmergencyRefund?: () => void;
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
  checkOrderStatus,
  onEmergencyExchange,
  onEmergencyRefund
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

  // Handlers for new actions
  const handleRetryCurrentPrice = () => {
    console.log("Retrying at current price");
    if (checkOrderStatus) {
      checkOrderStatus();
    }
  };

  return (
    <>
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleCopyAddress} 
        onRetryCurrentPrice={handleRetryCurrentPrice}
        onEmergencyExchange={onEmergencyExchange}
        onEmergencyRefund={onEmergencyRefund}
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
