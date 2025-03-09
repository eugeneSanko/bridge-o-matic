
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface BridgeFormActionsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  onBridgeAssets: (e: React.MouseEvent) => Promise<void>;
  errorMessage?: string | null;
}

export const BridgeFormActions = ({
  isFormValid,
  isSubmitting,
  onBridgeAssets,
  errorMessage,
}: BridgeFormActionsProps) => {
  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <Button
        className="w-full h-[3.5rem] sm:h-[4.5rem] text-base sm:text-lg font-medium bg-[#0FA0CE] hover:bg-[#0FA0CE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onBridgeAssets}
        disabled={!isFormValid || isSubmitting || !!errorMessage}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Order...
          </>
        ) : (
          "Bridge Assets"
        )}
      </Button>

      <p className="text-xs text-center text-gray-400">
        By proceeding, you agree to our Terms of Service
      </p>
    </div>
  );
};
