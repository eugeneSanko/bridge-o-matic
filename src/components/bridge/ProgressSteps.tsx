
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
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CompletedTransactionView } from "./CompletedTransactionView";

interface ProgressStepsProps {
  currentStatus?: string;
  orderDetails?: any;
}

export const ProgressSteps = ({
  currentStatus = "pending",
  orderDetails,
}: ProgressStepsProps) => {
  // State to track final status after normalization
  const [normalizedStatus, setNormalizedStatus] = useState(currentStatus);
  const [animate, setAnimate] = useState(false);

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
      <div className="grid grid-cols-4 gap-4 md:gap-8 relative">
        {steps.map((step, i) => {
          const Icon = step.icon;
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
              } ${animate ? "animate-pulse" : ""}`} // <--- Added animation here
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
            </motion.div>
          );
        })}
      </div>
    );
  };

  // If completed, show the completed transaction view
  if (isCompleted) {
    return (
      <div className="p-0 rounded-xl mb-9 overflow-hidden">
        <div className="glass-card p-6 md:p-8 rounded-xl mb-4">
          {renderStepper()}
        </div>

        <CompletedTransactionView orderDetails={orderDetails} />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl mb-9">
      {renderStepper()}
    </div>
  );
};
