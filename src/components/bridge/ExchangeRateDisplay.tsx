
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExchangeRateDisplayProps {
  lastUpdateTime: Date | null;
  onRefresh: () => void;
  refreshEnabled: boolean;
  timeRemaining: string | null;
}

export const ExchangeRateDisplay = ({
  lastUpdateTime,
  onRefresh,
  refreshEnabled,
  timeRemaining,
}: ExchangeRateDisplayProps) => {
  if (!lastUpdateTime) return null;

  return (
    <div className="text-xs text-center text-gray-400 mb-4 flex items-center justify-center gap-2">
      <span>Rates last updated: {lastUpdateTime.toLocaleTimeString()}</span>
      {timeRemaining && (
        <span className="flex items-center text-xs text-[#0FA0CE]">
          <Clock className="h-3 w-3 mr-1" />
          {timeRemaining}s
        </span>
      )}
      <Button
        variant="link"
        className="text-xs text-[#0FA0CE] ml-2 p-0 h-auto"
        onClick={onRefresh}
        disabled={!refreshEnabled}
      >
        {refreshEnabled ? "Refresh manually" : "Wait 2m to refresh"}
      </Button>
    </div>
  );
};
