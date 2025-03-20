
import {
  Loader,
  Clock,
  ArrowLeftRight,
  CircleCheckBig,
  Check,
  Star,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TransactionInfoItem } from "./TransactionInfoItem";
import { useMobile } from "@/hooks/use-mobile";
import { getExplorerUrl, hasExplorerUrl } from "@/utils/explorerUtils";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";

interface ProgressStepsProps {
  currentStatus?: string;
  orderDetails?: any;
  isRefunded?: boolean;
  refundCurrency?: string;
}

export const ProgressSteps = ({
  currentStatus = "pending",
  orderDetails,
  isRefunded = false,
  refundCurrency = "",
}: ProgressStepsProps) => {
  // State to track final status after normalization
  const [normalizedStatus, setNormalizedStatus] = useState(currentStatus);
  const [animate, setAnimate] = useState(false);
  const isMobile = useMobile();

  // Log the current status to debug
  console.log("ProgressSteps received status:", currentStatus);

  useEffect(() => {
    // Trigger animation when normalizedStatus changes
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500); // Adjust duration as needed
    return () => clearTimeout(timer);
  }, [normalizedStatus]);

  // Normalize status on mount and when it changes
  useEffect(() => {
    // Use a consistent status format for our component
    let statusToUse = currentStatus?.toLowerCase() || "pending";

    // Handle API status codes (uppercase)
    if (currentStatus === "DONE") statusToUse = "completed";
    if (currentStatus === "EXPIRED") statusToUse = "expired";
    if (currentStatus === "EMERGENCY") statusToUse = "failed";

    console.log(`Normalized status: ${currentStatus} -> ${statusToUse}`);
    setNormalizedStatus(statusToUse);
  }, [currentStatus]);

  // Function to copy order ID to clipboard
  const handleCopyOrderId = (id: string) => {
    if (!id) return;
    
    try {
      navigator.clipboard.writeText(id);
      console.log("Copied order ID to clipboard:", id);
    } catch (error) {
      console.error("Failed to copy order ID:", error);
    }
  };

  // Map FF.io API status to step index
  const getActiveStepIndex = (status: string): number => {
    if (!status) return 0;

    // Normalize status to lowercase for consistency
    const lowerStatus = status.toLowerCase();
    console.log(
      "Processing status in getActiveStepIndex:",
      status,
      "Lowercased:",
      lowerStatus
    );

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
      done: 3, // Added lowercase "done" mapping
    };

    // First check if it's a direct FF.io API status (case-sensitive)
    if (status in apiStatusMap) {
      const index = apiStatusMap[status];
      console.log(`Found status "${status}" in API map, index:`, index);
      return index;
    }

    // Then check if it's our app status (case-insensitive)
    if (lowerStatus in appStatusMap) {
      const index = appStatusMap[lowerStatus];
      console.log(`Found status "${lowerStatus}" in app map, index:`, index);
      return index;
    }

    console.log(`Status "${status}" not found in any map, defaulting to 0`);
    return 0;
  };

  // Returns appropriate visual status indicators
  const getStatusType = (status: string): string => {
    if (!status) return "";

    console.log("Processing status in getStatusType:", status);

    // First check uppercase FF.io API statuses
    if (status === "DONE") return "completed";
    if (status === "EMERGENCY") return "failed";
    if (status === "EXPIRED") return "expired";

    // Then check lowercase app statuses
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

  // Format timestamp for display
  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Check if we're in a completed state either from API or app status
  const isCompleted =
    normalizedStatus === "completed" ||
    currentStatus === "DONE" ||
    currentStatus?.toLowerCase() === "done";

  console.log("Is completed:", isCompleted, {
    normalizedStatus,
    currentStatus,
    currentStatusLower: currentStatus?.toLowerCase(),
  });

  // For expired status, modify the first step icon and text
  const isExpired =
    normalizedStatus === "expired" || currentStatus === "EXPIRED";

  const activeStep = getActiveStepIndex(currentStatus);
  const statusType = getStatusType(currentStatus);
  console.log("Active step:", activeStep, "Status type:", statusType);

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
      <div className="grid grid-cols-4 gap-2 md:gap-8 relative">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isLastStep = i === steps.length - 1;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
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
              } ${animate ? "animate-pulse" : ""}`}
            >
              <div
                className={`flex justify-center mb-2 md:mb-3 ${
                  isMobile ? "" : "-ml-10"
                }`}
              >
                <Icon
                  className={`h-5 w-5 md:h-8 md:w-8 ${
                    step.active && step.icon === Loader
                      ? "animate-spin [animation-duration:3s]"
                      : ""
                  }`}
                />
              </div>
              <div
                className={`text-xs md:text-sm font-medium ${
                  isMobile ? "" : "-ml-10"
                } truncate`}
              >
                {isMobile && step.label.length > 10
                  ? step.label.split(" ")[0]
                  : step.label}
              </div>
              {step.status === "failed" && (
                <div
                  className={`text-xs text-red-500 mt-1 ${
                    isMobile ? "hidden" : "-ml-10"
                  }`}
                >
                  Transaction failed
                </div>
              )}
              {step.status === "refunded" && (
                <div
                  className={`text-xs text-yellow-500 mt-1 ${
                    isMobile ? "hidden" : "-ml-10"
                  }`}
                >
                  Funds refunded
                </div>
              )}
              {step.status === "expired" && (
                <div
                  className={`text-xs text-red-500 mt-1 ${
                    isMobile ? "hidden" : "-ml-10"
                  }`}
                >
                  Time window expired
                </div>
              )}
              {i < 3 && (
                <div
                  className={`absolute top-3 md:top-4 left-[60%] w-[80%] h-[1px] md:h-[2px] ${
                    activeStep > i ? "bg-green-700" : "bg-gray-700"
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // If completed, show the completed transaction view
  if (isCompleted) {
    // Extract transaction data from API response
    const apiResponse = orderDetails?.rawApiResponse || {};
    const fromTx = apiResponse?.from?.tx || {};
    const toTx = apiResponse?.to?.tx || {};

    // Extract network information for explorer links
    const fromNetwork =
      apiResponse?.from?.network || apiResponse?.from?.coin || "";
    const toNetwork = apiResponse?.to?.network || apiResponse?.to?.coin || "";

    // Order ID to display and copy
    const displayOrderId = apiResponse?.id || orderDetails?.orderId || "N/A";

    return (
      <div className="p-0 rounded-xl mb-4 md:mb-9 overflow-hidden">
        <div className="glass-card p-3 md:p-8 rounded-xl mb-4">
          {renderStepper()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 boarder-0">
          {/* Order Details Card (Left) */}
          <Card className="p-4 md:p-6 space-y-3 md:space-y-4 glass-card">
            <div className="border-b border-white/10 pb-2 md:pb-3">
              <div className="text-gray-400 text-xs md:text-sm">Order ID</div>
              <div className="text-[#f0b90b] font-mono font-semibold text-base md:text-xl flex items-center gap-2">
                {displayOrderId}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 md:h-6 md:w-6"
                  onClick={() => handleCopyOrderId(displayOrderId)}
                >
                  <Copy className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="border-b border-white/10 pb-2 md:pb-3">
              <div className="text-gray-400 text-xs md:text-sm">
                Order status
              </div>
              <div className="text-green-500 font-medium text-base md:text-xl">
                Completed
              </div>
            </div>

            <div className="border-b border-white/10 pb-2 md:pb-3">
              <div className="text-gray-400 text-xs md:text-sm">Order type</div>
              <div className="text-white text-lg">
                {apiResponse?.type === "fixed" ? "Fixed rate" : "Float rate"}
              </div>
            </div>

            <div className="border-b border-white/10 pb-2 md:pb-3">
              <div className="text-gray-400 text-xs md:text-sm">
                Creation Time
              </div>
              <div className="text-white text-lg">
                {formatTimestamp(apiResponse?.time?.reg)}
              </div>
            </div>

            <div className="border-b border-white/10 pb-2 md:pb-3">
              <div className="text-gray-400 text-xs md:text-sm">
                Received Time
              </div>
              <div className="text-white text-lg">
                {formatTimestamp(fromTx?.timeReg)}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-xs md:text-sm">
                Completed Time
              </div>
              <div className="text-white text-lg">
                {formatTimestamp(apiResponse?.time?.finish)}
              </div>
            </div>
          </Card>

          {/* Confirmation Card (Right) */}
          <Card className="glass-card p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
            {/* Updated robot image on the left */}
            <div className="hidden md:block absolute -left-9 md:-left-32 -bottom-14 opa-50">
              <img
                src="https://tradenly.xyz/wp-content/uploads/2024/12/AlbedoBase_XL_Design_a_futuristic_space_robot_fighter_sleek_an_0-removebg-preview.png"
                alt="Robot"
                className="w-40 h-40 md:w-[15rem] md:h-[22rem] lg:w-[28rem] lg:h-[25rem] object-contain "
              />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-8 md:pl-52">
              {/* Add padding-left to avoid text overlapping with the image */}
              <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 md:justify-items-start">
                {isRefunded
                  ? `Your ${
                      refundCurrency ||
                      apiResponse?.from?.coin ||
                      orderDetails?.fromCurrency ||
                      "crypto"
                    } was refunded`
                  : `Your ${
                      apiResponse?.to?.coin ||
                      orderDetails?.toCurrency ||
                      "Ethereum"
                    } was sent`}
                <Check
                  className={`h-6 w-6 ${
                    isRefunded ? "text-blue-500" : "text-green-500"
                  }`}
                />
              </h2>
              <p className="text-gray-300 max-w-md mx-auto md:text-left md:ml-10">
                {isRefunded
                  ? "Your refund has been processed. Thank you for using our service."
                  : "If you enjoyed your experience on Tradenly Bridge, please leave a review at services below. We appreciate your support!"}
              </p>
              {!isRefunded && (
                <div className="flex gap-6 justify-center mt-4">
                  <a
                    href="https://x.com/Tradenly"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  >
                    <div className=" group p-4 rounded-2xl bg-black hover:bg-primary transition-colors duration-200 mb-3">
                      <Icon
                        icon="ri:twitter-x-fill"
                        width="30"
                        height="30"
                        className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-125"
                      />
                    </div>
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Transaction Details (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Accepted Transaction (Left) */}
          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Accepted transaction info
            </h3>

            <div className="space-y-3">
              <TransactionInfoItem
                label="TxID"
                value={fromTx?.id}
                isTxId={true}
                copyable={true}
                network={fromNetwork}
              />

              {fromTx?.id && hasExplorerUrl(fromTx.id, fromNetwork) ? (
                <TransactionInfoItem
                  label="View Receipt"
                  value="View on Explorer"
                  isLink={true}
                  linkUrl={getExplorerUrl(fromTx.id, fromNetwork) || ""}
                />
              ) : (
                <></>
              )}

              <TransactionInfoItem
                label="Received Time"
                value={formatTimestamp(fromTx?.timeReg)}
              />

              <TransactionInfoItem
                label="Block Time"
                value={formatTimestamp(fromTx?.timeBlock)}
              />

              <TransactionInfoItem
                label="Confirmations"
                value={fromTx?.confirmations}
              />

              <TransactionInfoItem
                label="Amount"
                value={`${
                  apiResponse?.from?.amount ||
                  orderDetails?.depositAmount ||
                  "N/A"
                } ${
                  apiResponse?.from?.code || orderDetails?.fromCurrency || "N/A"
                }`}
              />

              <TransactionInfoItem
                label="Fee"
                value={`${fromTx?.fee || "0"} ${
                  fromTx?.ccyfee || apiResponse?.from?.code || "N/A"
                }`}
              />
            </div>
          </Card>

          {/* Sent Transaction (Right) */}
          <Card className=" p-6 border-0 glass-card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Sent transaction info
            </h3>

            <div className="space-y-3">
              <TransactionInfoItem
                label="TxID"
                value={toTx?.id}
                isTxId={true}
                copyable={true}
                network={toNetwork}
              />

              {toTx?.id && hasExplorerUrl(toTx.id, toNetwork) ? (
                <TransactionInfoItem
                  label="View Receipt"
                  value="View on Explorer"
                  isLink={true}
                  linkUrl={getExplorerUrl(toTx.id, toNetwork) || ""}
                />
              ) : (
                <></>
              )}

              <TransactionInfoItem
                label="Sending time"
                value={formatTimestamp(toTx?.timeReg)}
              />

              <TransactionInfoItem
                label="Block Time"
                value={formatTimestamp(toTx?.timeBlock)}
              />

              <TransactionInfoItem
                label="Confirmations"
                value={toTx?.confirmations}
              />

              <TransactionInfoItem
                label="Amount"
                value={`${
                  apiResponse?.to?.amount ||
                  orderDetails?.receiveAmount ||
                  "N/A"
                } ${
                  apiResponse?.to?.code || orderDetails?.toCurrency || "N/A"
                }`}
              />

              <TransactionInfoItem
                label="Fee"
                value={`${toTx?.fee || "0"} ${
                  toTx?.ccyfee || apiResponse?.to?.code || "N/A"
                }`}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-3 md:p-6 lg:p-8 rounded-xl mb-6 md:mb-9">
      {renderStepper()}
    </div>
  );
};
