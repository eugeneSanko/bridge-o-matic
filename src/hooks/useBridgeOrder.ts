
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface OrderDetails {
  orderId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  estimatedReceivedAmount: number;
  depositAddress: string;
  destinationAddress: string;
  orderType: 'fixed' | 'float';
  currentStatus: 'awaiting_deposit' | 'confirming' | 'processing' | 'completed' | 'expired' | 'failed';
  createdAt: string;
  expiresAt: string;
}

export function useBridgeOrder(orderId: string | null) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API call to fetch order details
  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API fetch with timeout
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        // Create mock order details
        const mockOrderDetails: OrderDetails = {
          orderId,
          fromCurrency: "BTC",
          toCurrency: "ETH",
          amount: 0.05,
          estimatedReceivedAmount: 0.875,
          depositAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          destinationAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          orderType: "fixed",
          currentStatus: "awaiting_deposit",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        };

        setOrderDetails(mockOrderDetails);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        setError("Failed to fetch order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleCopyAddress = useCallback(() => {
    if (!orderDetails?.depositAddress) return;
    
    navigator.clipboard.writeText(orderDetails.depositAddress)
      .then(() => {
        toast({
          title: "Address copied",
          description: "Deposit address copied to clipboard",
        });
      })
      .catch(err => {
        console.error("Failed to copy address:", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      });
  }, [orderDetails?.depositAddress]);

  return { orderDetails, loading, error, handleCopyAddress };
}
