
import {
  Loader,
  Clock,
  ArrowLeftRight,
  CircleCheckBig,
  Copy,
  ExternalLink,
  Check,
  Star,
  SendHorizonal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";

interface ProgressStepsProps {
  currentStatus?: string;
  orderDetails?: any;
  skipCompletedStepper?: boolean;
}

export const ProgressSteps = ({
  currentStatus = "pending",
  orderDetails,
  skipCompletedStepper = false,
}: ProgressStepsProps) => {
  const getActiveStepIndex = (status: string): number => {
    if (!status) return 0;
    
    // Updated API status map to give EXCHANGE its own step (step 2)
    const apiStatusMap: Record<string, number> = {
      NEW: 0,
      PENDING: 1,
      EXCHANGE: 2, // Now EXCHANGE has its own distinct step
      WITHDRAW: 3,
      DONE: 4,
      EXPIRED: 0,
      EMERGENCY: 4,
    };

    const appStatusMap: Record<string, number> = {
      new: 0,
      pending: 0,
      processing: 1,
      exchanging: 2, // Match the EXCHANGE step
      sending: 3,
      completed: 4,
      expired: 0,
      refunding: 1,
      refunded: 4,
      failed: 4,
      emergency: 4,
      unknown: 0,
    };

    if (status in apiStatusMap) {
      return apiStatusMap[status];
    }

    return appStatusMap[status.toLowerCase()] || 0;
  };

  const getStatusType = (status: string): string => {
    if (!status) return "";
    
    if (status === "DONE") return "completed";
    if (status === "EMERGENCY") return "failed";
    if (status === "EXPIRED") return "expired";

    const lowerStatus = status.toLowerCase();

    if (["done", "completed"].includes(lowerStatus)) {
      return "completed";
    } else if (["failed", "emergency"].includes(lowerStatus)) {
      return "failed";
    } else if (["expired"].includes(lowerStatus)) {
      return "expired";
    } else if (["refunded"].includes(lowerStatus)) {
      return "refunded";
    }

    return "";
  };

  const activeStep = getActiveStepIndex(currentStatus);
  const statusType = getStatusType(currentStatus);
  const isCompleted =
    statusType === "completed" ||
    currentStatus === "DONE" ||
    (currentStatus?.toLowerCase() === "completed");

  const isExpired =
    statusType === "expired" ||
    currentStatus === "EXPIRED" ||
    currentStatus?.toLowerCase() === "expired";

  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";

    const now = Date.now();
    const then = timestamp * 1000;
    const diffMs = now - then;

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const getTransactionData = () => {
    const apiResponse = orderDetails?.rawApiResponse;
    if (!apiResponse) return null;

    const timeData = apiResponse.time || {};
    const fromTx = apiResponse.from?.tx || {};
    const toTx = apiResponse.to?.tx || {};

    return {
      creationTime: formatTimestamp(timeData.reg),
      receivedTime: formatTimestamp(timeData.start),
      completedTime: formatTimestamp(timeData.finish),
      creationTimeAgo: formatTimeAgo(timeData.reg),
      receivedTimeAgo: formatTimeAgo(timeData.start),
      completedTimeAgo: formatTimeAgo(timeData.finish),
      fromTxId: fromTx.id || "",
      fromAmount: fromTx.amount || "",
      fromFee: fromTx.fee || "0",
      fromFeeCurrency: fromTx.ccyfee || "",
      fromConfirmations: fromTx.confirmations || "0",
      fromMaxConfirmations: apiResponse.from?.reqConfirmations || "1",
      toTxId: toTx.id || "",
      toAmount: toTx.amount || "",
      toFee: toTx.fee || "0",
      toFeeCurrency: toTx.ccyfee || "",
      toConfirmations: toTx.confirmations || "0",
    };
  };

  const renderStepper = () => {
    // Updated steps array to include a distinct "Exchanging" step
    const steps = [
      {
        label: "Awaiting deposit",
        icon: Clock,
        active: activeStep === 0,
        completed: activeStep > 0,
        status: isExpired ? "expired" : "",
      },
      {
        label: "Awaiting confirmations",
        icon: Loader,
        active: activeStep === 1,
        completed: activeStep > 1,
      },
      {
        label: "Exchanging", // New dedicated step for EXCHANGE status
        icon: ArrowLeftRight,
        active: activeStep === 2,
        completed: activeStep > 2,
      },
      {
        label: "Sending funds",
        icon: SendHorizonal,
        active: activeStep === 3,
        completed: activeStep > 3,
      },
      {
        label: "Done",
        icon: CircleCheckBig,
        active: activeStep === 4,
        completed: isCompleted,
        status: statusType !== "expired" ? statusType : "",
      },
    ];

    return (
      <div className="grid grid-cols-5 gap-3 md:gap-6 relative">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className={`text-center relative ${
                step.status === "failed"
                  ? "text-red-500"
                  : step.status === "refunded"
                  ? "text-yellow-500"
                  : step.status === "expired"
                  ? "text-red-500"
                  : step.status === "completed"
                  ? "text-green-500"
                  : step.active
                  ? "text-[#0FA0CE]"
                  : step.completed
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              <div className="flex justify-center mb-3 -ml-10">
                <Icon
                  className={`h-6 w-6 md:h-8 md:w-8 ${
                    step.active && step.icon === Loader
                      ? "animate-spin [animation-duration:3s]"
                      : ""
                  }`}
                />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                {step.label}
              </div>
              {step.status === "failed" && (
                <div className="text-xs text-red-500 mt-1 -ml-10">
                  Transaction failed
                </div>
              )}
              {step.status === "refunded" && (
                <div className="text-xs text-yellow-500 mt-1 -ml-10">
                  Funds refunded
                </div>
              )}
              {step.status === "expired" && (
                <div className="text-xs text-red-500 mt-1 -ml-10">
                  Time window expired
                </div>
              )}
              {i < 4 && (
                <div
                  className={`absolute top-4 left-[60%] w-[80%] h-[2px] ${
                    activeStep > i ? "bg-green-700" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isCompleted && !skipCompletedStepper) {
    const txData = getTransactionData();

    return (
      <div className="p-0 rounded-xl mb-9 overflow-hidden">
        <div className="glass-card p-6 md:p-8 rounded-xl mb-9">
          <div className="grid grid-cols-5 gap-3 md:gap-6 relative">
            <div className="text-center relative text-green-500">
              <div className="flex justify-center mb-3 -ml-10">
                <Clock className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                Awaiting deposit
              </div>
              <div className="absolute top-4 left-[60%] w-[80%] h-[2px] bg-green-700" />
            </div>
            
            <div className="text-center relative text-green-500">
              <div className="flex justify-center mb-3 -ml-10">
                <Loader className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                Awaiting confirmations
              </div>
              <div className="absolute top-4 left-[60%] w-[80%] h-[2px] bg-green-700" />
            </div>
            
            <div className="text-center relative text-green-500">
              <div className="flex justify-center mb-3 -ml-10">
                <ArrowLeftRight className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                Exchanging
              </div>
              <div className="absolute top-4 left-[60%] w-[80%] h-[2px] bg-green-700" />
            </div>
            
            <div className="text-center relative text-green-500">
              <div className="flex justify-center mb-3 -ml-10">
                <SendHorizonal className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                Sending funds
              </div>
              <div className="absolute top-4 left-[60%] w-[80%] h-[2px] bg-green-700" />
            </div>
            
            <div className="text-center relative text-green-500">
              <div className="flex justify-center mb-3 -ml-10">
                <CircleCheckBig className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-xs md:text-sm font-medium -ml-10">
                Done
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 boarder-0">
          <Card className="p-6 space-y-4 glass-card">
            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Order ID</div>
              <div className="text-[#f0b90b] font-mono font-semibold text-xl flex items-center gap-2">
                {orderDetails?.orderId || "GDBHQ4"}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    navigator.clipboard.writeText(orderDetails?.orderId || "")
                  }
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Order status</div>
              <div className="text-green-500 font-medium text-xl">
                Completed
              </div>
            </div>

            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Order type</div>
              <div className="text-white text-lg">
                {orderDetails?.orderType === "fixed"
                  ? "Fixed rate"
                  : "Float rate"}
              </div>
            </div>

            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Creation Time</div>
              <div className="text-white text-lg">
                {txData?.creationTime || new Date().toLocaleString()}
              </div>
            </div>

            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Received Time</div>
              <div className="text-white text-lg">
                {txData?.receivedTime ||
                  new Date(Date.now() - 5 * 60000).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm">Completed Time</div>
              <div className="text-white text-lg">
                {txData?.completedTime || new Date().toLocaleString()}
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
            <div className="hidden md:block absolute left-0 -bottom-14 opa-50">
              <img
                src="/lovable-uploads/robo.png"
                alt="Robot"
                className="w-40 h-40 md:w-[15rem] md:h-[22rem] lg:w-[22rem] lg:h-[25rem] object-contain "
              />
            </div>

            <div className="relative z-10 text-center space-y-8 md:pl-48">
              <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 md:justify-items-start">
                Your {orderDetails?.toCurrency || "Ethereum"} was sent
                <Check className="h-6 w-6 text-green-500" />
              </h2>
              <p className="text-gray-300 max-w-md mx-auto md:text-left">
                If you enjoy your experience on FixedFloat, please leave a
                review at services below. We appreciate your support!
              </p>
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
                  <Star className="h-5 w-5 text-green-500" />
                  <span>Trustpilot</span>
                </a>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Accepted transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2">
                  {txData?.fromTxId
                    ? `${txData.fromTxId.substring(0, 20)}...`
                    : "9b942cf8b8e3aa944be74lc462c0c243c7a..."}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      navigator.clipboard.writeText(txData?.fromTxId || "")
                    }
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View Receipt</span>
                <a
                  className="flex gap-2"
                  href={`https://ff.io/order/${
                    orderDetails?.orderId || "GDBHQ4"
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Received Time</span>
                <span className="text-white">
                  {txData?.receivedTimeAgo || "19 hours ago"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">
                  {txData?.receivedTimeAgo || "19 hours ago"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">
                  {txData?.fromConfirmations || "40"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {txData?.fromAmount || orderDetails?.depositAmount || "200"}{" "}
                  {orderDetails?.fromCurrency || "ADA"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  {txData?.fromFee || "0.168845"}{" "}
                  {txData?.fromFeeCurrency ||
                    orderDetails?.fromCurrency ||
                    "ADA"}
                </span>
              </div>
            </div>
          </Card>

          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Sent transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2">
                  {txData?.toTxId
                    ? `${txData.toTxId.substring(0, 20)}...`
                    : "0x7ba710acc700ca056cfabb22e8dda54fa..."}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      navigator.clipboard.writeText(txData?.toTxId || "")
                    }
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View Receipt</span>
                <a
                  className="flex gap-2"
                  href={`https://ff.io/order/${
                    orderDetails?.orderId || "GDBHQ4"
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sending time</span>
                <span className="text-white">
                  {txData?.completedTimeAgo || "19 hours ago"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">
                  {txData?.completedTimeAgo || "19 hours ago"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">
                  {txData?.toConfirmations || "30"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {txData?.toAmount ||
                    orderDetails?.receiveAmount ||
                    "0.0541047"}{" "}
                  {orderDetails?.toCurrency || "ETH"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  {txData?.toFee || "0"}{" "}
                  {txData?.toFeeCurrency || orderDetails?.toCurrency || "ETH"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl mb-9">
      {renderStepper()}
    </div>
  );
};
