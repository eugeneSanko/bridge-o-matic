
import { useState, useEffect, useCallback } from "react";
import { API_CONFIG, invokeFunctionWithRetry } from "@/config/api";
import { toast } from "@/hooks/use-toast";

export interface OrderData {
  id: string;
  ff_order_id: string;
  ff_order_token: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  destination_address: string;
  status: string;
  created_at: string;
  deposit_address: string;
  initial_rate: number;
  expiration_time: string;
}

export interface OrderDetails {
  depositAddress: string;
  depositAmount: string;
  currentStatus: string;
  fromCurrency: string;
  toCurrency: string;
  orderId: string;
  destinationAddress: string;
  expiresAt: string | null;
  timeRemaining: string | null;
  ffOrderId: string;
  ffOrderToken: string;
}

export function useBridgeOrder(orderId: string | null, shouldFetch: boolean = true) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !shouldFetch) {
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching order details for", orderId, "- shouldFetch:", shouldFetch);
      
      // Use {retry: false} to disable automatic retries
      const orderResult = await invokeFunctionWithRetry('bridge-order', {
        body: { orderId },
        options: { retry: false }
      });

      if (!orderResult || orderResult.error) {
        throw new Error(orderResult?.error?.message || "Failed to fetch order details");
      }

      const order = orderResult.data as OrderData;

      if (!order.ff_order_id || !order.ff_order_token) {
        throw new Error("Order doesn't have exchange information");
      }

      // Also disable retries for status check
      const statusData = await invokeFunctionWithRetry(API_CONFIG.FF_STATUS, {
        body: { 
          id: order.ff_order_id, 
          token: order.ff_order_token 
        },
        options: { retry: false }
      });

      if (!statusData || statusData.error) {
        throw new Error(statusData?.error || "Failed to fetch order status");
      }

      let timeRemaining = null;
      let expiresAt = order.expiration_time;
      
      if (expiresAt) {
        const expirationTime = new Date(expiresAt);
        const now = new Date();
        const diffMs = expirationTime.getTime() - now.getTime();
        
        if (diffMs > 0) {
          const diffMinutes = Math.floor(diffMs / 60000);
          const diffSeconds = Math.floor((diffMs % 60000) / 1000);
          timeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        }
      } else if (statusData.details && statusData.details.expiration) {
        const expirationTime = new Date(statusData.details.expiration * 1000);
        expiresAt = expirationTime.toISOString();
        
        const now = new Date();
        const diffMs = expirationTime.getTime() - now.getTime();
        
        if (diffMs > 0) {
          const diffMinutes = Math.floor(diffMs / 60000);
          const diffSeconds = Math.floor((diffMs % 60000) / 1000);
          timeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        }
      }

      setOrderDetails({
        depositAddress: order.deposit_address || (statusData.details?.from?.address || "Generating address..."),
        depositAmount: statusData.details?.from?.amount || order.amount.toString(),
        currentStatus: statusData.status || order.status,
        fromCurrency: order.from_currency,
        toCurrency: order.to_currency,
        orderId: order.id,
        ffOrderId: order.ff_order_id,
        ffOrderToken: order.ff_order_token,
        destinationAddress: order.destination_address,
        expiresAt,
        timeRemaining
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setLoading(false);
    }
  }, [orderId, shouldFetch]);

  useEffect(() => {
    if (shouldFetch) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
    
    // Only set up polling if we want to fetch and have an actual order ID
    if (shouldFetch && orderId) {
      const interval = window.setInterval(fetchOrderDetails, 15000);
      setPollingInterval(interval);
      
      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
    
    return undefined;
  }, [orderId, shouldFetch, fetchOrderDetails]);

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied",
          description: "Address copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy address",
          variant: "destructive"
        });
      });
  };

  return {
    orderDetails,
    loading,
    error,
    handleCopyAddress
  };
}
