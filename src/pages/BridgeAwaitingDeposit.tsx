import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBridgeOrder } from "@/hooks/useBridgeOrder";
import { useDeepLink } from "@/hooks/useDeepLink";
import { LoadingState } from "@/components/bridge/LoadingState";
import { ErrorState } from "@/components/bridge/ErrorState";
import { EmptyState } from "@/components/bridge/EmptyState";
import { BridgeTransaction } from "@/components/bridge/BridgeTransaction";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DebugPanel } from "@/components/bridge/DebugPanel";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CompletedTransaction } from "@/types/bridge";

const REFRESHABLE_STATUSES = ["NEW", "PENDING", "EXCHANGE", "WITHDRAW"];

const BridgeAwaitingDeposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";

  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [statusCheckError, setStatusCheckError] = useState(null);
  const [statusCheckDebugInfo, setStatusCheckDebugInfo] = useState(null);

  const {
    orderDetails: originalOrderDetails,
    loading,
    error,
    handleCopyAddress,
  } = useBridgeOrder(orderId, true, true);

  const [orderDetails, setOrderDetails] = useState(originalOrderDetails);
  const { deepLink, addLog } = useDeepLink();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!originalOrderDetails) return;

    if (simulateSuccess) {
      setOrderDetails({
        ...originalOrderDetails,
        currentStatus: "completed",
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE",
        },
      });
    } else {
      setOrderDetails(originalOrderDetails);
    }
  }, [originalOrderDetails, simulateSuccess]);

  const checkOrderStatus = async () => {
    if (!orderId || !token) {
      console.error("Missing order ID or token for status check");
      setStatusCheckError("Missing order ID or token");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("bridge-status", {
        body: { id: orderId, token },
      });

      if (error) {
        console.error("Error calling bridge-status function:", error);
        setStatusCheckError(`Error: ${error.message}`);
        setStatusCheckDebugInfo({ error });
        return;
      }

      if (data.debugInfo) {
        setStatusCheckDebugInfo(data.debugInfo);
      }

      if (data.code === 0 && data.data) {
        const status = data.data.status;

        setOrderDetails((prevDetails) => ({
          ...prevDetails!,
          currentStatus: status.toLowerCase(),
          rawApiResponse: data.data,
        }));

        if (status === "DONE" && !transactionSaved) {
          toast({
            title: "Transaction Complete",
            description: `Your transaction has been completed successfully.`,
            variant: "default",
          });

          setTransactionSaved(true);
          clearInterval(intervalRef.current);
          navigate(`/bridge/order-complete?orderId=${orderId}`);
        }

        if (!REFRESHABLE_STATUSES.includes(status)) {
          clearInterval(intervalRef.current);
        }
      } else {
        setStatusCheckError(`API Error: ${data.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setStatusCheckError(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "No order information found",
        variant: "destructive",
      });
    }
  }, [orderId]);

  // Auto-refresh for specific statuses every 15 seconds
  useEffect(() => {
    if (
      !orderDetails ||
      !REFRESHABLE_STATUSES.includes(orderDetails.rawApiResponse?.status)
    ) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      checkOrderStatus();
    }, 15000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [orderDetails?.rawApiResponse?.status]);

  return (
    <>
      <div className="fixed top-4 right-4 z-50 bg-black/80 p-3 rounded-lg flex items-center gap-3">
        <Switch
          id="simulate-success"
          checked={simulateSuccess}
          onCheckedChange={setSimulateSuccess}
        />
        <Label htmlFor="simulate-success" className="text-sm text-white">
          Simulate Completed
        </Label>
      </div>

      <Button onClick={checkOrderStatus} className="my-4">
        Refresh Status
      </Button>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {!orderDetails && <EmptyState />}

      {orderDetails && (
        <BridgeTransaction
          orderDetails={orderDetails}
          onCopyAddress={handleCopyAddress}
        />
      )}

      {statusCheckDebugInfo && (
        <div className="mt-8">
          <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
        </div>
      )}
    </>
  );
};

export default BridgeAwaitingDeposit;
