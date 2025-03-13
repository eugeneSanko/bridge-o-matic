
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { DebugInfoDisplay } from "@/components/bridge/DebugInfoDisplay";
import { CompletedTransactionSaver } from "@/components/bridge/CompletedTransactionSaver";

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
}

export const BridgeStatusRenderer = ({
  loading,
  error,
  orderDetails,
  handleCopyAddress,
  statusCheckDebugInfo,
  simulateSuccess,
  originalOrderDetails,
  token,
  transactionSaved,
  setTransactionSaved
}: BridgeStatusRendererProps) => {
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

  return (
    <>
      <BridgeTransaction 
        orderDetails={orderDetails} 
        onCopyAddress={handleCopyAddress} 
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
      />
    </>
  );
};
