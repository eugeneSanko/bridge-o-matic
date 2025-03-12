
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
  raw_api_response?: any;  // Store the full API response
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
        
        // Verify order is completed but don't redirect if not
        // Just show the error on this page instead
        if (result.data.status !== "completed") {
          console.log(`Order status is ${result.data.status}, not completed`);
          setError(`This order is not completed yet. Current status: ${result.data.status}`);
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

  // Helper function to format Unix timestamps
  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Extract transaction times from API response
  const getTransactionTimes = () => {
    const apiResponse = orderDetails?.raw_api_response?.data;
    if (!apiResponse || !apiResponse.time) {
      return {
        creationTime: formatTimestamp(undefined),
        receivedTime: formatTimestamp(undefined),
        completedTime: formatTimestamp(undefined)
      };
    }
    
    return {
      creationTime: formatTimestamp(apiResponse.time.reg),
      receivedTime: formatTimestamp(apiResponse.time.start),
      completedTime: formatTimestamp(apiResponse.time.finish)
    };
  };
  
  // Get transaction details for "from" currency
  const getFromTransactionDetails = () => {
    const apiResponse = orderDetails?.raw_api_response?.data;
    if (!apiResponse || !apiResponse.from || !apiResponse.from.tx) {
      return {
        txId: "",
        receivedTime: "N/A",
        blockTime: "N/A",
        confirmations: "0",
        amount: "0",
        fee: "0",
        feeCurrency: ""
      };
    }
    
    const tx = apiResponse.from.tx;
    return {
      txId: tx.id || "",
      receivedTime: formatTimestamp(tx.timeReg),
      blockTime: formatTimestamp(tx.timeBlock),
      confirmations: tx.confirmations || "0",
      amount: tx.amount || "0",
      fee: tx.fee || "0",
      feeCurrency: tx.ccyfee || ""
    };
  };
  
  // Get transaction details for "to" currency
  const getToTransactionDetails = () => {
    const apiResponse = orderDetails?.raw_api_response?.data;
    if (!apiResponse || !apiResponse.to || !apiResponse.to.tx) {
      return {
        txId: "",
        sentTime: "N/A",
        blockTime: "N/A",
        confirmations: "0",
        amount: "0",
        fee: "0",
        feeCurrency: ""
      };
    }
    
    const tx = apiResponse.to.tx;
    return {
      txId: tx.id || "",
      sentTime: formatTimestamp(tx.timeReg),
      blockTime: formatTimestamp(tx.timeBlock),
      confirmations: tx.confirmations || "0",
      amount: tx.amount || "0",
      fee: tx.fee || "0",
      feeCurrency: tx.ccyfee || ""
    };
  };

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
  
  // Get timestamp data from API response
  const { creationTime, receivedTime, completedTime } = getTransactionTimes();
  const fromTx = getFromTransactionDetails();
  const toTx = getToTransactionDetails();

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
          receiveAmount={toTx.amount}
          // Use coin data from API response if available
          fromCurrencyCoin={orderDetails.raw_api_response?.data?.from?.coin}
          toCurrencyCoin={orderDetails.raw_api_response?.data?.to?.coin}
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
                {creationTime}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-8">
          {/* Accepted Transaction (Left) */}
          <div className="glass-card p-6 border-0">
            <h3 className="text-xl font-semibold text-white mb-4">
              Accepted transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2 overflow-hidden text-ellipsis">
                  {fromTx.txId.substring(0, 20)}...
                  <button 
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => navigator.clipboard.writeText(fromTx.txId)}
                  >
                    <span className="sr-only">Copy</span>
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View Receipt</span>
                <a
                  className="flex gap-2 text-blue-400 hover:text-blue-300"
                  href={`https://ff.io/order/${orderDetails.ff_order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Received Time</span>
                <span className="text-white">{fromTx.receivedTime}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">{fromTx.blockTime}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">{fromTx.confirmations}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {fromTx.amount} {orderDetails.from_currency}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  {fromTx.fee} {fromTx.feeCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* Sent Transaction (Right) */}
          <div className="glass-card p-6 border-0">
            <h3 className="text-xl font-semibold text-white mb-4">
              Sent transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2 overflow-hidden text-ellipsis">
                  {toTx.txId.substring(0, 20)}...
                  <button 
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => navigator.clipboard.writeText(toTx.txId)}
                  >
                    <span className="sr-only">Copy</span>
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View Receipt</span>
                <a
                  className="flex gap-2 text-blue-400 hover:text-blue-300"
                  href={`https://ff.io/order/${orderDetails.ff_order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sending time</span>
                <span className="text-white">{toTx.sentTime}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">{toTx.blockTime}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">{toTx.confirmations}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {toTx.amount} {orderDetails.to_currency}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  {toTx.fee} {toTx.feeCurrency}
                </span>
              </div>
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
