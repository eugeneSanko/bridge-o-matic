import {
  Loader,
  LoaderPinwheel,
  Clock,
  ArrowLeftRight,
  CircleCheckBig,
} from "lucide-react";

interface ProgressStepsProps {
  currentStatus?: string;
}

export const ProgressSteps = ({
  currentStatus = "pending",
}: ProgressStepsProps) => {
  // Map status to step index
  const getActiveStepIndex = (status: string): number => {
    const statusMap: Record<string, number> = {
      pending: 0,
      processing: 1,
      exchanging: 1,
      sending: 2,
      completed: 3,
      expired: 0,
      refunding: 1,
      refunded: 3,
      failed: 3,
      unknown: 0,
    };

    return statusMap[status] || 0;
  };

  const activeStep = getActiveStepIndex(currentStatus);

  const steps = [
    {
      label: "Awaiting deposit",
      icon: Loader,
      active: activeStep === 0,
      completed: activeStep > 0,
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
      status:
        currentStatus === "completed"
          ? "completed"
          : currentStatus === "failed"
          ? "failed"
          : currentStatus === "refunded"
          ? "refunded"
          : "",
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
                <div className="text-xs text-red-500 mt-1">
                  Transaction failed
                </div>
              )}
              {step.status === "refunded" && (
                <div className="text-xs text-yellow-500 mt-1">
                  Funds refunded
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
