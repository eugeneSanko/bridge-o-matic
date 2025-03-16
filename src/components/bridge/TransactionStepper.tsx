
import { 
  Loader, 
  Clock, 
  ArrowLeftRight, 
  CircleCheckBig 
} from "lucide-react";
import { useEffect, useState } from "react";
import { StepIndicator } from "./StepIndicator";
import { getActiveStepIndex, getStatusType } from "./utils/statusUtils";

interface TransactionStepperProps {
  currentStatus?: string;
  animate?: boolean;
  isExpired?: boolean;
}

export const TransactionStepper = ({ 
  currentStatus = "pending", 
  animate = false,
  isExpired = false
}: TransactionStepperProps) => {
  const activeStep = getActiveStepIndex(currentStatus);
  const statusType = getStatusType(currentStatus);
  
  console.log("Active step:", activeStep, "Status type:", statusType);
  
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
      isLastStep: true
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 md:gap-8 relative">
      {steps.map((step, i) => (
        <StepIndicator
          key={i}
          label={step.label}
          icon={step.icon}
          active={step.active}
          completed={step.completed}
          status={step.status}
          isLastStep={step.isLastStep}
          animate={animate}
        />
      ))}
    </div>
  );
};
