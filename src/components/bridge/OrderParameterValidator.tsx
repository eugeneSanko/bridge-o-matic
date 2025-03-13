
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface OrderParameterValidatorProps {
  orderId: string | null;
  token: string;
}

export const OrderParameterValidator = ({
  orderId,
  token,
}: OrderParameterValidatorProps) => {
  // Check for missing order ID
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order ID",
        description: "No order information found",
        variant: "destructive"
      });
    } else {
      console.log(`Processing order ID: ${orderId} with token: ${token}`);
    }
  }, [orderId, token]);

  // This is a utility component that doesn't render anything
  return null;
};
