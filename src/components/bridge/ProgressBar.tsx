
import React, { useEffect } from "react";
import { 
  Package, 
  Clock, 
  ArrowLeftRight, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface ProgressBarProps {
  currentStatus?: string;
  timeRemaining?: string | null;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStatus = "NEW",
  timeRemaining
}) => {
  // Debug for tracking status updates
  useEffect(() => {
    console.log("ProgressBar rendering with status:", currentStatus, "Time remaining:", timeRemaining);
  }, [currentStatus, timeRemaining]);

  // Map API status to step index (0-based)
  const getActiveStepIndex = (status: string): number => {
    if (!status) return 0;

    // Status mapping - use uppercase for API statuses
    const statusMap: Record<string, number> = {
      "NEW": 0,
      "PENDING": 1,
      "EXCHANGE": 2,
      "WITHDRAW": 3,
      "DONE": 4,
      "EXPIRED": -1,
      "EMERGENCY": -1,
      // Handle lowercase variants too
      "new": 0,
      "pending": 1,
      "exchange": 2,
      "withdraw": 3,
      "done": 4,
      "expired": -1,
      "emergency": -1,
      // App-specific status mapping
      "processing": 1,
      "exchanging": 2,
      "sending": 3,
      "completed": 4,
    };

    return statusMap[status] || 0;
  };

  // Check for special statuses like expired or emergency
  const isErrorStatus = currentStatus === "EXPIRED" || 
    currentStatus === "EMERGENCY" ||
    currentStatus?.toLowerCase() === "expired" ||
    currentStatus?.toLowerCase() === "emergency";

  // Define the steps in the progress flow
  const steps = [
    {
      label: "Awaiting deposit",
      icon: <Package className="w-6 h-6" />,
      status: ["NEW"]
    },
    {
      label: "Awaiting confirmations",
      icon: <Clock className="w-6 h-6" />,
      status: ["PENDING"]
    },
    {
      label: "Perform exchange",
      icon: <ArrowLeftRight className="w-6 h-6" />,
      status: ["EXCHANGE", "WITHDRAW"]
    },
    {
      label: "Done",
      icon: <CheckCircle className="w-6 h-6" />,
      status: ["DONE"]
    }
  ];

  const activeStep = getActiveStepIndex(currentStatus || "");

  return (
    <div className="w-full mb-6 mt-4">
      {isErrorStatus ? (
        // Error state display
        <div className="flex flex-col items-center justify-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-400">
            {currentStatus === "EXPIRED" ? "Transaction Expired" : "Transaction Failed"}
          </h3>
          <p className="text-sm text-red-300 mt-1">
            {currentStatus === "EXPIRED" 
              ? "The time limit for this transaction has passed." 
              : "There was an issue with this transaction."}
          </p>
        </div>
      ) : (
        // Normal progress bar
        <div className="flex items-center justify-between relative">
          {/* Progress line connector */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gray-700" />
          
          {/* Completed line */}
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${activeStep >= 3 
                ? '100%' 
                : activeStep >= 0 
                  ? `${(activeStep / (steps.length - 1)) * 100}%` 
                  : '0%'}`
            }}
          />
          
          {/* Step circles */}
          {steps.map((step, index) => {
            // Determine step status
            const isActive = activeStep === index;
            const isCompleted = activeStep > index || currentStatus === "DONE" || currentStatus?.toLowerCase() === "completed";
            
            // Special case: if we're on EXCHANGE or WITHDRAW, also mark the "Perform exchange" step
            const isExchangeStep = index === 2 && (
              currentStatus === "EXCHANGE" || 
              currentStatus === "WITHDRAW" ||
              currentStatus?.toLowerCase() === "exchanging" ||
              currentStatus?.toLowerCase() === "sending"
            );

            return (
              <div key={index} className="flex flex-col items-center z-10 relative">
                {/* Circle indicator */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isCompleted 
                      ? "bg-blue-500 text-white" 
                      : isActive || isExchangeStep
                        ? "bg-blue-400 text-white" 
                        : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step.icon}
                </div>
                
                {/* Step label */}
                <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                  isCompleted 
                    ? "text-blue-500" 
                    : isActive || isExchangeStep
                      ? "text-blue-400" 
                      : "text-gray-500"
                }`}>
                  {step.label}
                </span>

                {/* Timer for pending status */}
                {isActive && timeRemaining && index === 0 && (
                  <span className="text-xs mt-1 text-yellow-400">
                    Time left: {timeRemaining}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
