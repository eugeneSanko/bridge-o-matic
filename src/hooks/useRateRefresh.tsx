
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useRateRefresh = (calculateReceiveAmount: () => Promise<void> | void) => {
  const { toast } = useToast();
  const [manualRefreshEnabled, setManualRefreshEnabled] = useState<boolean>(true);

  const handleRefreshRate = () => {
    if (manualRefreshEnabled) {
      calculateReceiveAmount();
      setManualRefreshEnabled(false);
      toast({
        title: "Rates refreshed",
        description: "Next manual refresh available in 2 minutes",
        duration: 3000,
      });
      setTimeout(() => setManualRefreshEnabled(true), 120000); // 2 minutes
    } else {
      toast({
        title: "Please wait",
        description: "Manual rate refresh is available every 2 minutes",
        duration: 3000,
      });
    }
  };

  return {
    manualRefreshEnabled,
    handleRefreshRate,
  };
};
