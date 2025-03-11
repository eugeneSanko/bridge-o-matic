
import { Loader2, Clock, ArrowRight, CheckCircle2, TimerOff } from "lucide-react";

interface ProgressStepsProps {
  currentStatus?: string;
}

export const ProgressSteps = ({
  currentStatus = "pending",
}: ProgressStepsProps) => {
  // Map FF.io API status to step index
  const getActiveStepIndex = (status: string): number => {
    // Lowercase the status for case-insensitive comparison
    const lowerStatus = status?.toLowerCase() || "pending";
    
    // Define direct mappings from FF.io API statuses
    const apiStatusMap: Record<string, number> = {
      // FF.io API status codes (original case)
      "NEW": 0,      // Awaiting deposit
      "PENDING": 1,  // Transaction received, pending confirmation
      "EXCHANGE": 1, // Transaction confirmed, exchange in progress
      "WITHDRAW": 2, // Sending funds
      "DONE": 3,     // Order completed
      "EXPIRED": 0,  // Order expired
      "EMERGENCY": 3 // Emergency, customer choice required
    };
    
    // Our app-specific status codes (lowercase)
    const appStatusMap: Record<string, number> = {
      "new": 0,
      "pending": 0,
      "processing": 1,
      "exchanging": 1,
      "sending": 2,
      "completed": 3,
      "expired": 0,
      "refunding": 1,
      "refunded": 3,
      "failed": 3,
      "emergency": 3,
      "unknown": 0,
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

  // For expired status, modify the first step icon and text
  const isExpired = statusType === "expired" || currentStatus === "EXPIRED" || currentStatus?.toLowerCase() === "expired";

  const steps = [
    {
      label: isExpired ? "Deposit expired" : "Awaiting deposit",
      icon: isExpired ? TimerOff : Loader2,
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
      icon: ArrowRight,
      active: activeStep === 2,
      completed: activeStep > 2,
    },
    {
      label: "Done",
      icon: CheckCircle2,
      active: activeStep === 3,
      completed: false,
      status: statusType !== "expired" ? statusType : "",
    },
  ];

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl mb-9">
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
                    step.active && step.icon === Loader2 ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div className="text-xs md:text-sm font-medium">{step.label}</div>
              {step.status === "failed" && (
                <div className="text-xs text-red-500 mt-1">
                  Transaction failed
                </div>
              )}
              {step.status === "refunded" && (
                <div className="text-xs text-yellow-500 mt-1">
                  Funds refunded
                </div>
              )}
              {step.status === "expired" && (
                <div className="text-xs text-red-500 mt-1">
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
    </div>
  );
};
