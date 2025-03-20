
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OrderDetails } from "@/hooks/useBridgeOrder";

interface ProgressStepsProps {
  currentStatus: string;
  orderDetails: OrderDetails;
  isRefunded?: boolean;
  refundCurrency?: string;
}

export const ProgressSteps = ({
  currentStatus,
  orderDetails,
  isRefunded = false,
  refundCurrency = ""
}: ProgressStepsProps) => {
  const steps = [
    { key: "NEW", label: "Awaiting Deposit" },
    { key: "PENDING", label: "Processing" },
    { key: "EXCHANGE", label: "Exchanging" },
    { key: "WITHDRAW", label: "Sending" },
    { key: "DONE", label: "Completed" },
  ];

  // For refunded orders, adjust the steps
  const refundedSteps = [
    { key: "NEW", label: "Awaiting Deposit" },
    { key: "REFUND", label: `Refunded to ${refundCurrency}` },
  ];

  // For expired orders that were not completed
  const expiredSteps = [
    { key: "NEW", label: "Awaiting Deposit" },
    { key: "EXPIRED", label: "Expired" },
  ];

  // For emergency orders that were not completed
  const emergencySteps = [
    { key: "NEW", label: "Awaiting Deposit" },
    { key: "EMERGENCY", label: "Emergency" },
  ];

  const handleCopyOrderId = () => {
    if (orderDetails.orderId) {
      navigator.clipboard.writeText(orderDetails.orderId)
        .then(() => {
          toast({
            title: "Copied",
            description: "Order ID copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to copy order ID",
            variant: "destructive",
          });
        });
    }
  };

  let activeSteps = steps;
  if (isRefunded) {
    activeSteps = refundedSteps;
  } else if (currentStatus === "EXPIRED" && orderDetails.currentStatus !== "completed") {
    activeSteps = expiredSteps;
  } else if (currentStatus === "EMERGENCY" && orderDetails.currentStatus !== "completed") {
    activeSteps = emergencySteps;
  }

  // Find the current step index
  let currentStepIndex = activeSteps.findIndex((step) => step.key === currentStatus);
  
  // If the status is "completed", use the DONE index
  if (orderDetails.currentStatus === "completed") {
    currentStepIndex = activeSteps.findIndex((step) => step.key === "DONE");
    if (currentStepIndex === -1) {
      currentStepIndex = activeSteps.length - 1; // Use the last step if DONE not found
    }
  }
  
  // If we couldn't find the index, default to the first step
  if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  const progressPercentage = ((currentStepIndex + 1) / activeSteps.length) * 100;

  return (
    <div className="flex flex-col mb-6 md:mb-10">
      <div className="flex justify-between items-center mb-1 md:mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Order ID: {orderDetails.orderId} 
          <Button
            variant="ghost"
            size="icon"
            className="p-0 h-6 w-6 ml-1 hover:bg-transparent"
            onClick={handleCopyOrderId}
            title="Copy Order ID"
          >
            <Copy className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {orderDetails.currentStatus === "completed" 
            ? "Completed" 
            : `${currentStepIndex + 1} of ${activeSteps.length}`}
        </div>
      </div>
      
      <Progress value={progressPercentage} className="mb-2" />
      
      <div className="flex justify-between mt-1">
        {activeSteps.map((step, index) => (
          <div 
            key={step.key} 
            className={`text-xs flex flex-col items-center ${
              index <= currentStepIndex ? "font-medium text-primary" : "text-gray-400"
            }`}
          >
            <div className={`w-4 h-4 mb-1 rounded-full ${
              index <= currentStepIndex ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
            } flex items-center justify-center text-[10px] text-white`}>
              {index < currentStepIndex ? "✓" : index + 1}
            </div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
