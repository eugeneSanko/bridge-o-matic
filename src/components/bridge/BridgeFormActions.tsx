import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface BridgeFormActionsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  onBridgeAssets: (e: React.MouseEvent) => Promise<void>;
  errorMessage?: string | null;
  formValues?: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
    destinationAddress: string;
    orderType: "fixed" | "float";
  };
}

export const BridgeFormActions = ({
  isFormValid,
  isSubmitting,
  onBridgeAssets,
  errorMessage,
  formValues,
}: BridgeFormActionsProps) => {
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null
  );

  // Reset local error message when form values change
  useEffect(() => {
    if (formValues && errorMessage) {
      setLocalErrorMessage(null);
    } else {
      setLocalErrorMessage(errorMessage || null);
    }
  }, [errorMessage, formValues]);

  return (
    <div className="space-y-4">
      <Button
        className="w-full h-[3.5rem] sm:h-[4.5rem] text-base sm:text-lg font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onBridgeAssets}
        disabled={!isFormValid || isSubmitting}
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

      {localErrorMessage && (
        <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-md">
          {localErrorMessage}
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        By proceeding, you agree to our Terms of Service
      </p>
    </div>
  );
};
