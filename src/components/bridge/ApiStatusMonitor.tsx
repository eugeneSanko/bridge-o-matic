
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface ApiStatusMonitorProps {
  apiAttempted: boolean;
  setApiAttempted: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  orderDetails: any | null;
}

export const ApiStatusMonitor = ({
  apiAttempted,
  setApiAttempted,
  loading,
  error,
  orderDetails
}: ApiStatusMonitorProps) => {
  // Track API attempt status
  useEffect(() => {
    if (!apiAttempted && (loading || error || orderDetails)) {
      setApiAttempted(true);
      
      if (error) {
        console.error("API error detected:", error);
        toast({
          title: "Connection Error",
          description: "Could not fetch order details from the exchange API.",
          variant: "destructive"
        });
      }
    }
  }, [apiAttempted, loading, error, orderDetails, setApiAttempted]);

  // This is a utility component that doesn't render anything
  return null;
};
