
import { useEffect, useState } from "react";
import { CompletedTransactionView } from "./CompletedTransactionView";
import { TransactionStepper } from "./TransactionStepper";
import { normalizeStatus } from "./utils/statusUtils";

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
    const statusToUse = normalizeStatus(currentStatus);
    setNormalizedStatus(statusToUse);
  }, [currentStatus]);

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

  // If completed, show the completed transaction view
  if (isCompleted) {
    return (
      <div className="p-0 rounded-xl mb-9 overflow-hidden">
        <div className="glass-card p-6 md:p-8 rounded-xl mb-4">
          <TransactionStepper 
            currentStatus={currentStatus} 
            animate={animate}
            isExpired={isExpired}
          />
        </div>

        <CompletedTransactionView orderDetails={orderDetails} />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl mb-9">
      <TransactionStepper 
        currentStatus={currentStatus} 
        animate={animate}
        isExpired={isExpired}
      />
    </div>
  );
};
