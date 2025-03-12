import {
  Loader,
  LoaderPinwheel,
  Clock,
  ArrowLeftRight,
  CircleCheckBig,
  Copy,
  ExternalLink,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

interface ProgressStepsProps {
  currentStatus?: string;
  orderDetails?: any;
}

export const ProgressSteps = ({
  currentStatus = "pending",
  orderDetails,
}: ProgressStepsProps) => {
  // Map FF.io API status to step index
  const getActiveStepIndex = (status: string): number => {
    // Lowercase the status for case-insensitive comparison
    const lowerStatus = status?.toLowerCase() || "pending";

    // Define direct mappings from FF.io API statuses
    const apiStatusMap: Record<string, number> = {
      // FF.io API status codes (original case)
      NEW: 0, // Awaiting deposit
      PENDING: 1, // Transaction received, pending confirmation
      EXCHANGE: 1, // Transaction confirmed, exchange in progress
      WITHDRAW: 2, // Sending funds
      DONE: 3, // Order completed
      EXPIRED: 0, // Order expired
      EMERGENCY: 3, // Emergency, customer choice required
    };

    // Our app-specific status codes (lowercase)
    const appStatusMap: Record<string, number> = {
      new: 0,
      pending: 0,
      processing: 1,
      exchanging: 1,
      sending: 2,
      completed: 3,
      expired: 0,
      refunding: 1,
      refunded: 3,
      failed: 3,
      emergency: 3,
      unknown: 0,
    };

    // First check if it's a direct FF.io API status
    if (status in apiStatusMap) {
      return apiStatusMap[status];
    }

    // Then check if it's our app status
    return appStatusMap[lowerStatus] || 0;
  };

  // Returns appropriate visual status indicators
  const getStatusType = (status: string): string => {
    // First check uppercase FF.io API statuses
    if (status === "DONE") return "completed";
    if (status === "EMERGENCY") return "failed";
    if (status === "EXPIRED") return "expired";

    // Then check lowercase app statuses
    const lowerStatus = status?.toLowerCase() || "pending";

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
    currentStatus?.toLowerCase() === "completed";

  // For expired status, modify the first step icon and text
  const isExpired =
    statusType === "expired" ||
    currentStatus === "EXPIRED" ||
    currentStatus?.toLowerCase() === "expired";

  // Render stepper component (for non-completed states)
  const renderStepper = () => {
    const steps = [
      {
        label: "Awaiting deposit",
        icon: Loader,
        active: activeStep === 0,
        completed: activeStep > 0,
        status: isExpired ? "expired" : "",
      },
      {
        label: "Awaiting confirmations",
        icon: Clock,
        active: activeStep === 1,
        completed: activeStep > 1,
      },
      {
        label: "Perform exchange",
        icon: ArrowLeftRight,
        active: activeStep === 2,
        completed: activeStep > 2,
      },
      {
        label: "Done",
        icon: CircleCheckBig,
        active: activeStep === 3,
        completed: false,
        status: statusType !== "expired" ? statusType : "",
      },
    ];

    return (
      <div className="grid grid-cols-4 gap-4 md:gap-8 relative">
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
              {i < 3 && (
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

  // If completed, show the completed transaction view
  if (isCompleted) {
    return (
      <div className=" p-0 rounded-xl mb-9 overflow-hidden">
        <ProgressSteps></ProgressSteps>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 boarder-0">
          {/* Order Details Card (Left) */}
          <Card className=" p-6 space-y-4 glass-card">
            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Order ID</div>
              <div className="text-[#f0b90b] font-mono font-semibold text-xl flex items-center gap-2">
                {orderDetails?.orderId || "GDBHQ4"}
                <Button variant="ghost" size="icon" className="h-6 w-6">
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
                {new Date().toLocaleString()}
              </div>
            </div>

            <div className="border-b border-white/10 pb-3">
              <div className="text-gray-400 text-sm">Received Time</div>
              <div className="text-white text-lg">
                {new Date(Date.now() - 5 * 60000).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm">Completed Time</div>
              <div className="text-white text-lg">
                {new Date().toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Confirmation Card (Right) */}

          <Card className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
            {/* Robot image on the left */}
            <div className="hidden md:block absolute left-0 -bottom-14 opa-50">
              <img
                src="/lovable-uploads/robo.png"
                alt="Robot"
                className="w-40 h-40 md:w-[15rem] md:h-[22rem] lg:w-[22rem] lg:h-[25rem] object-contain "
              />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-8 md:pl-48">
              {" "}
              {/* Add padding-left to avoid text overlapping with the image */}
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

        {/* Transaction Details (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4  ">
          {/* Accepted Transaction (Left) */}
          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Accepted transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2">
                  9b942cf8b8e3aa944be74lc462c0c243c7a...
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View on the blockchain</span>
                <div className="flex gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Received Time</span>
                <span className="text-white">19 hours ago</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">19 hours ago</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">40</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {orderDetails?.depositAmount || "200"}{" "}
                  {orderDetails?.fromCurrency || "ADA"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  0.168845 {orderDetails?.fromCurrency || "ADA"}
                </span>
              </div>
            </div>
          </Card>

          {/* Sent Transaction (Right) */}
          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Sent transaction info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TxID</span>
                <div className="font-mono text-sm text-white flex items-center gap-2">
                  0x7ba710acc700ca056cfabb22e8dda54fa...
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">View on the blockchain</span>
                <div className="flex gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sending time</span>
                <span className="text-white">19 hours ago</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Time</span>
                <span className="text-white">19 hours ago</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmations</span>
                <span className="text-white">30</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">
                  {orderDetails?.receiveAmount || "0.0541047"}{" "}
                  {orderDetails?.toCurrency || "ETH"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">
                  0 {orderDetails?.toCurrency || "ETH"}
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
