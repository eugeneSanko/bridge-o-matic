
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface OrderParameterValidatorProps {
  orderId: string | null;
  token: string;
  isLoading?: boolean;
}

export const OrderParameterValidator = ({
  orderId,
  token,
  isLoading = false,
}: OrderParameterValidatorProps) => {
  // Check for missing order ID only after loading is complete
  useEffect(() => {
    if (!isLoading && !orderId) {
      toast({
        title: "Missing Order ID",
        description: "No order information found",
        variant: "destructive"
      });
    } else if (!isLoading && orderId) {
      console.log(`Processing order ID: ${orderId} with token: ${token}`);
    }
  }, [orderId, token, isLoading]);

  // This is a utility component that doesn't render anything
  return null;
};
