
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TransactionSummary } from "@/components/bridge/TransactionSummary";
import { toast } from "@/hooks/use-toast";
import { invokeFunctionWithRetry } from "@/config/api";
import { CompletedTransactionView } from "@/components/bridge/CompletedTransactionView";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { Check, CircleCheckBig } from "lucide-react";

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
  
  // State to hold copy actions
  const [copyClicked, setCopyClicked] = useState(false);

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyClicked(true);
    toast({
      title: "Copied!",
      description: "The text has been copied to your clipboard.",
      duration: 3000,
    });
    setTimeout(() => setCopyClicked(false), 1000);
  };

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

  // Convert OrderData to OrderDetails format expected by CompletedTransactionView
  const adaptedOrderDetails: OrderDetails = {
    orderId: orderDetails.ff_order_id,
    ffOrderToken: orderDetails.ff_order_token,
    orderType: "fixed", // Default to fixed if not available
    depositAmount: orderDetails.amount.toString(),
    receiveAmount: (orderDetails.amount * orderDetails.initial_rate).toFixed(6),
    fromCurrency: orderDetails.from_currency,
    toCurrency: orderDetails.to_currency,
    fromCurrencyName: orderDetails.from_currency_name,
    toCurrencyName: orderDetails.to_currency_name,
    depositAddress: orderDetails.deposit_address,
    destinationAddress: orderDetails.destination_address,
    timeRemaining: null,
    expiresAt: orderDetails.expiration_time,
    currentStatus: orderDetails.status,
    rawApiResponse: {
      status: "DONE",
    },
  };

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
          receiveAmount={(orderDetails.amount * orderDetails.initial_rate).toFixed(6)}
          orderType="fixed"
        />

        <div className="glass-card p-6 md:p-8 rounded-xl mb-4">
          <div className="grid grid-cols-4 gap-4 md:gap-8 relative">
            {/* Completed stepper */}
            {[
              { label: "Awaiting deposit", completed: true },
              { label: "Awaiting confirmations", completed: true },
              { label: "Perform exchange", completed: true },
              { label: "Done", completed: true, status: "completed" },
            ].map((step, i) => (
              <div
                key={i}
                className={`text-center relative ${
                  step.status === "completed" ? "text-green-500" : "text-green-500"
                }`}
              >
                <div className="flex justify-center mb-3 -ml-10">
                  {i < 3 ? (
                    <Check className="h-6 w-6 md:h-8 md:w-8" />
                  ) : (
                    <CircleCheckBig className="h-6 w-6 md:h-8 md:w-8" />
                  )}
                </div>
                <div className="text-xs md:text-sm font-medium -ml-10">
                  {step.label}
                </div>
                {i < 3 && (
                  <div className="absolute top-4 left-[60%] w-[80%] h-[2px] bg-green-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        <CompletedTransactionView 
          orderDetails={adaptedOrderDetails} 
          onCopyClick={handleCopyAddress}
        />

        <div className="flex justify-center mt-8">
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
