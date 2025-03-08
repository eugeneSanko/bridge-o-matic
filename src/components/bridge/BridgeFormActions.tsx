
import { Button } from "@/components/ui/button";

interface BridgeFormActionsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  onBridgeAssets: (e: React.MouseEvent) => Promise<void>;
}

export const BridgeFormActions = ({
  isFormValid,
  isSubmitting,
  onBridgeAssets,
}: BridgeFormActionsProps) => {
  return (
    <div className="space-y-4">
      <Button
        className="w-full h-[3.5rem] sm:h-[4.5rem] text-base sm:text-lg font-medium bg-[#0FA0CE] hover:bg-[#0FA0CE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onBridgeAssets}
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Bridge Assets"}
      </Button>

      <p className="text-xs text-center text-gray-400">
        By proceeding, you agree to our Terms of Service
      </p>
    </div>
  );
};
