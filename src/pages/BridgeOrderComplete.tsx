
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { TransactionSummary } from "@/components/bridge/TransactionSummary";
import { toast } from "@/hooks/use-toast";
import { invokeFunctionWithRetry } from "@/config/api";

interface OrderData {
  id: string;
  ff_order_id: string;
  ff_order_token: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  destination_address: string;
  status: string;
  deposit_address: string;
  initial_rate: number;
  created_at: string;
  expiration_time: string;
}

const BridgeOrderComplete = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        const result = await invokeFunctionWithRetry('bridge-order', {
          body: { orderId }
        });

        if (!result || result.error) {
          throw new Error(result?.error?.message || "Failed to fetch order details");
        }

        setOrderDetails(result.data);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch order details");
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bridge-accent mx-auto mb-4"></div>
          <p className="text-gray-300">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24 flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8 rounded-xl">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || "Order not found"}</p>
          <button 
            className="w-full bg-bridge-accent hover:bg-bridge-accent/90 text-white py-2 px-4 rounded"
            onClick={() => window.location.href = "/bridge"}
          >
            Return to Bridge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24">
      <div className="max-w-6xl mx-auto animate-slideUp">
        <TransactionSummary 
          fromCurrency={orderDetails.from_currency}
          toCurrency={orderDetails.to_currency}
          amount={orderDetails.amount.toString()}
          destinationAddress={orderDetails.destination_address}
        />

        <div className="glass-card p-8 rounded-xl mb-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-green-500/20 rounded-full p-3">
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">Transaction Complete</h2>
          <p className="text-gray-400 text-center mb-8">
            Your {orderDetails.to_currency} has been sent to your wallet
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card bg-secondary/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Order ID</h3>
              <p className="font-mono text-sm break-all">{orderDetails.ff_order_id}</p>
            </div>
            
            <div className="glass-card bg-secondary/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Created At</h3>
              <p className="font-mono text-sm">
                {new Date(orderDetails.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            className="bg-bridge-accent hover:bg-bridge-accent/90 text-white py-2 px-8 rounded-lg"
            onClick={() => window.location.href = "/bridge"}
          >
            Start New Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default BridgeOrderComplete;
