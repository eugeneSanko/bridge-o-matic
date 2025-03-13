
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  from_currency_name?: string;
  to_currency_name?: string;
}

const BridgeOrderComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAttempted, setApiAttempted] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      if (apiAttempted) {
        console.log("API already attempted, skipping fetch");
        return;
      }

      setApiAttempted(true);

      try {
        console.log("Fetching complete order details for", orderId);
        const result = await invokeFunctionWithRetry('bridge-order', {
          body: { orderId },
          options: { retry: false }
        });

        if (!result || result.error) {
          throw new Error(result?.error?.message || "Failed to fetch order details");
        }

        console.log("Order details fetched successfully:", result.data);
        setOrderDetails(result.data);
        
        // Verify order is actually completed
        if (result.data.status !== "completed") {
          console.log(`Order status is ${result.data.status}, not completed. Redirecting to order page.`);
          navigate(`/bridge/awaiting-deposit?orderId=${orderId}`);
          return;
        }
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
  }, [orderId, apiAttempted, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0FA0CE] mx-auto mb-4"></div>
          <p className="text-gray-300">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8 rounded-xl">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || "Order not found"}</p>
          <button 
            className="w-full bg-[#0FA0CE] hover:bg-[#0FA0CE]/90 text-white py-2 px-4 rounded"
            onClick={() => navigate("/bridge")}
          >
            Return to Bridge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <TransactionSummary 
          fromCurrency={orderDetails.from_currency}
          toCurrency={orderDetails.to_currency}
          amount={orderDetails.amount.toString()}
          destinationAddress={orderDetails.destination_address}
          fromCurrencyName={orderDetails.from_currency_name}
          toCurrencyName={orderDetails.to_currency_name}
          depositAddress={orderDetails.deposit_address}
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
            className="bg-[#0FA0CE] hover:bg-[#0FA0CE]/90 text-white py-2 px-8 rounded-lg"
            onClick={() => navigate("/bridge")}
          >
            Start New Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default BridgeOrderComplete;
