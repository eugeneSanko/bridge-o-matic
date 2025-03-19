
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, CircleCheckBig, Copy, ExternalLink } from "lucide-react";
import { TransactionSummary } from "@/components/bridge/TransactionSummary";
import { toast } from "@/hooks/use-toast";
import { invokeFunctionWithRetry } from "@/config/api";
import { Progress } from "@/components/ui/progress";
import { ProgressSteps } from "@/components/bridge/ProgressSteps";

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

interface ApiOrderData {
  id: string;
  type: string;
  status: string;
  time: {
    reg: number;
    start: number;
    finish: number;
    update: number;
    expiration: number;
    left: number;
  };
  from: {
    code: string;
    coin: string;
    network: string;
    name: string;
    alias: string;
    amount: string;
    address: string;
    addressAlt: string | null;
    tag: string;
    tagName: string | null;
    reqConfirmations: number;
    maxConfirmations: number;
    tx?: {
      id: string;
      amount: string;
      fee: string;
      ccyfee: string;
      timeReg: number;
      timeBlock: number;
      confirmations: string;
    };
  };
  to: {
    code: string;
    coin: string;
    network: string;
    name: string;
    alias: string;
    amount: string;
    address: string;
    tag: string;
    tagName: string | null;
    tx?: {
      id: string;
      amount: string;
      fee: string;
      ccyfee: string;
      timeReg: number;
      timeBlock: number;
      confirmations: string;
    };
  };
  token: string;
}

const BridgeOrderComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isRefunded = searchParams.get("refund") === "true";
  const refundCurrency = searchParams.get("refundCurrency") || "";
  
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [apiOrderData, setApiOrderData] = useState<ApiOrderData | null>(null);
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
        
        if (result.data.status !== "completed") {
          console.log(`Order status is ${result.data.status}, not completed. Redirecting to order page.`);
          navigate(`/bridge/awaiting-deposit?orderId=${orderId}`);
          return;
        }

        try {
          console.log("Fetching detailed transaction data");
          const statusResult = await invokeFunctionWithRetry('bridge-status', {
            body: { 
              id: result.data.ff_order_id,
              token: result.data.ff_order_token 
            },
            options: { retry: false }
          });

          if (statusResult && !statusResult.error && statusResult.data && statusResult.data.code === 0) {
            console.log("Transaction details fetched:", statusResult.data.data);
            setApiOrderData(statusResult.data.data);
          } else {
            console.error("Could not fetch transaction details from status API", statusResult);
          }
        } catch (statusError) {
          console.error("Error fetching transaction details:", statusError);
          toast({
            title: "Error",
            description: "Failed to load order details",
            variant: "destructive"
          });
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

  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateTxId = (txId: string | undefined) => {
    if (!txId) return "N/A";
    if (txId.length <= 20) return txId;
    return `${txId.slice(0, 18)}...`;
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

  const fromTx = apiOrderData?.from?.tx;
  const toTx = apiOrderData?.to?.tx;

  // Create object similar to orderDetails type expected by ProgressSteps
  const progressOrderDetails = {
    fromCurrency: orderDetails.from_currency,
    toCurrency: orderDetails.to_currency,
    depositAmount: orderDetails.amount.toString(),
    depositAddress: orderDetails.deposit_address,
    destinationAddress: orderDetails.destination_address,
    currentStatus: "DONE",
    fromCurrencyName: orderDetails.from_currency_name,
    toCurrencyName: orderDetails.to_currency_name,
    orderId: orderDetails.ff_order_id
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
        />

        {/* Use ProgressSteps for consistent UI */}
        <ProgressSteps 
          currentStatus="DONE" 
          orderDetails={progressOrderDetails}
          isRefunded={isRefunded}
          refundCurrency={refundCurrency || apiOrderData?.from?.coin || orderDetails.from_currency}
        />

        <div className="glass-card p-8 rounded-xl mb-8">
          <div className="flex items-center justify-center mb-8">
            <div className={`${isRefunded ? "bg-blue-500/20" : "bg-green-500/20"} rounded-full p-3`}>
              <Check className={`h-8 w-8 ${isRefunded ? "text-blue-500" : "text-green-500"}`} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            {isRefunded 
              ? "Refund Complete" 
              : "Transaction Complete"}
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {isRefunded
              ? `Your ${refundCurrency || apiOrderData?.from?.coin || orderDetails.from_currency} has been refunded to your wallet`
              : `Your ${orderDetails.to_currency} has been sent to your wallet`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card bg-secondary/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Order ID</h3>
              <p className="font-mono text-sm break-all">{apiOrderData?.id || orderDetails.ff_order_id}</p>
            </div>
            
            <div className="glass-card bg-secondary/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Created At</h3>
              <p className="font-mono text-sm">
                {apiOrderData ? formatTimestamp(apiOrderData.time.reg) : 
                  new Date(orderDetails.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-0 rounded-xl mb-9 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 boarder-0">
            <div className="glass-card p-6 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <div className="text-gray-400 text-sm">Order ID</div>
                <div className="text-[#f0b90b] font-mono font-semibold text-xl flex items-center gap-2">
                  {apiOrderData?.id || orderDetails.ff_order_id}
                </div>
              </div>

              <div className="border-b border-white/10 pb-3">
                <div className="text-gray-400 text-sm">Order status</div>
                <div className={`${isRefunded ? "text-blue-500" : "text-green-500"} font-medium text-xl`}>
                  {isRefunded ? "Refunded" : "Completed"}
                </div>
              </div>

              <div className="border-b border-white/10 pb-3">
                <div className="text-gray-400 text-sm">Order type</div>
                <div className="text-white text-lg">
                  {apiOrderData?.type === "fixed" ? "Fixed rate" : "Float rate"}
                </div>
              </div>

              <div className="border-b border-white/10 pb-3">
                <div className="text-gray-400 text-sm">Creation Time</div>
                <div className="text-white text-lg">
                  {apiOrderData ? formatTimestamp(apiOrderData.time.reg) : 
                    new Date(orderDetails.created_at).toLocaleString()}
                </div>
              </div>

              <div className="border-b border-white/10 pb-3">
                <div className="text-gray-400 text-sm">Received Time</div>
                <div className="text-white text-lg">
                  {fromTx ? formatTimestamp(fromTx.timeReg) : "N/A"}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Completed Time</div>
                <div className="text-white text-lg">
                  {apiOrderData?.time.finish ? formatTimestamp(apiOrderData.time.finish) : "N/A"}
                </div>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
              <div className="hidden md:block absolute left-0 -bottom-14 opacity-50">
                <img
                  src="https://tradenly.xyz/wp-content/uploads/2024/12/AlbedoBase_XL_Design_a_futuristic_space_robot_fighter_sleek_an_0-removebg-preview.png"
                  alt="Robot"
                  className="w-40 h-40 md:w-[15rem] md:h-[22rem] lg:w-[22rem] lg:h-[25rem] object-contain"
                />
              </div>

              <div className="relative z-10 text-center space-y-8 md:pl-48">
                <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 md:justify-items-start">
                  {isRefunded 
                    ? `Your ${refundCurrency || apiOrderData?.from?.coin || orderDetails.from_currency} was refunded` 
                    : `Your ${apiOrderData?.to.coin || orderDetails.to_currency} was sent`}
                  <Check className={`h-6 w-6 ${isRefunded ? "text-blue-500" : "text-green-500"}`} />
                </h2>
                <p className="text-gray-300 max-w-md mx-auto md:text-left">
                  {isRefunded 
                    ? "Your refund has been processed. Thank you for using our service."
                    : "If you enjoy your experience, please leave a review at services below. We appreciate your support!"}
                </p>
                
                {!isRefunded && (
                  <div className="flex gap-6 justify-center mt-4">
                    <a
                      href="https://www.bestchange.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="bg-[#9EA13F]/20 p-2 rounded">BC</div>
                      <span>Bestchange</span>
                    </a>
                    <a
                      href="https://www.trustpilot.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="bg-[#00B67A]/20 p-2 rounded text-[#00B67A]">★</div>
                      <span>Trustpilot</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="glass-card p-6 border-0">
              <h3 className="text-xl font-semibold text-white mb-4">
                Accepted transaction info
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">TxID</span>
                  <div className="font-mono text-sm text-white flex items-center gap-2 truncate max-w-[200px]">
                    {truncateTxId(fromTx?.id)}
                    {fromTx?.id && (
                      <button onClick={() => {
                        navigator.clipboard.writeText(fromTx.id);
                        toast({
                          title: "Copied",
                          description: "Transaction ID copied to clipboard"
                        });
                      }}>
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">View Receipt</span>
                  <a
                    className="flex gap-2 text-blue-400"
                    href={`https://ff.io/order/${apiOrderData?.id || orderDetails.ff_order_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Received Time</span>
                  <span className="text-white">
                    {fromTx?.timeReg ? formatTimestamp(fromTx.timeReg) : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Block Time</span>
                  <span className="text-white">
                    {fromTx?.timeBlock ? formatTimestamp(fromTx.timeBlock) : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Confirmations</span>
                  <span className="text-white">{fromTx?.confirmations || "N/A"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">
                    {apiOrderData?.from.amount || orderDetails.amount} {apiOrderData?.from.code || orderDetails.from_currency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-white">
                    {fromTx?.fee || "N/A"} {fromTx?.ccyfee || apiOrderData?.from.code || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-0">
              <h3 className="text-xl font-semibold text-white mb-4">
                {isRefunded ? "Refund transaction info" : "Sent transaction info"}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">TxID</span>
                  <div className="font-mono text-sm text-white flex items-center gap-2 truncate max-w-[200px]">
                    {truncateTxId(toTx?.id)}
                    {toTx?.id && (
                      <button onClick={() => {
                        navigator.clipboard.writeText(toTx.id);
                        toast({
                          title: "Copied",
                          description: "Transaction ID copied to clipboard"
                        });
                      }}>
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">View Receipt</span>
                  <a
                    className="flex gap-2 text-blue-400"
                    href={`https://ff.io/order/${apiOrderData?.id || orderDetails.ff_order_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{isRefunded ? "Refund time" : "Sending time"}</span>
                  <span className="text-white">
                    {toTx?.timeReg ? formatTimestamp(toTx.timeReg) : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Block Time</span>
                  <span className="text-white">
                    {toTx?.timeBlock ? formatTimestamp(toTx.timeBlock) : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Confirmations</span>
                  <span className="text-white">{toTx?.confirmations || "N/A"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">
                    {apiOrderData?.to.amount || "N/A"} {apiOrderData?.to.code || orderDetails.to_currency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-white">
                    {toTx?.fee || "0"} {toTx?.ccyfee || apiOrderData?.to.code || orderDetails.to_currency}
                  </span>
                </div>
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
