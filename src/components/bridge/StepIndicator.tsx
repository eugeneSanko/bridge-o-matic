
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StepIndicatorProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  completed: boolean;
  status?: string;
  isLastStep?: boolean;
  animate?: boolean;
}

export const StepIndicator = ({
  label,
  icon: Icon,
  active,
  completed,
  status,
  isLastStep = false,
  animate = false,
}: StepIndicatorProps) => {
  const getStatusColor = () => {
    if (status === "failed") return "text-red-500";
    if (status === "refunded") return "text-yellow-500";
    if (status === "expired") return "text-red-500";
    if (status === "completed") return "text-green-500";
    if (active) return "text-[#0FA0CE]";
    if (completed) return "text-green-500";
    return "text-gray-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`text-center relative ${getStatusColor()} ${
        animate ? "animate-pulse" : ""
      }`}
    >
      <div className="flex justify-center mb-3 -ml-10">
        <Icon
          className={`h-6 w-6 md:h-8 md:w-8 ${
            active && Icon.name === "Loader"
              ? "animate-spin [animation-duration:3s]"
              : ""
          }`}
        />
      </div>
      <div className="text-xs md:text-sm font-medium -ml-10">
        {label}
      </div>
      {status === "failed" && (
        <div className="text-xs text-red-500 mt-1 -ml-10">
          Transaction failed
        </div>
      )}
      {status === "refunded" && (
        <div className="text-xs text-yellow-500 mt-1 -ml-10">
          Funds refunded
        </div>
      )}
      {status === "expired" && (
        <div className="text-xs text-red-500 mt-1 -ml-10">
          Time window expired
        </div>
      )}
      {!isLastStep && (
        <div
          className={`absolute top-4 left-[60%] w-[80%] h-[2px] ${
            completed ? "bg-green-700" : "bg-gray-700"
          }`}
        />
      )}
    </motion.div>
  );
};
