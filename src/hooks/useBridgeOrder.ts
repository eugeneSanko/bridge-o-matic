
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
  tag?: number | null;
  tagName?: string | null;
  addressAlt?: string | null;
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
  tag?: number | null;
  tagName?: string | null;
  addressAlt?: string | null;
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
      
      // For direct API use-case, the orderId parameter is actually the FF token
      // We just need to use this token for FF status API calls

      // In a real implementation with a server component, you would:
      // 1. Use the FF token to query the order status from FF API
      // 2. Update your local database with the latest status
      
      // For demo, simulate order details with realistic values from FF API response
      const staticOrderData = {
        id: "static-" + Math.random().toString(36).substring(2, 10),
        ff_order_id: "FF-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        ff_order_token: orderId, // The token from FF API is passed as orderId
        from_currency: "XRP",
        to_currency: "SOL",
        amount: 50,
        destination_address: "VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY",
        status: "NEW",
        created_at: new Date().toISOString(),
        deposit_address: "rffGCKC7Mk4cQ5aUGg8pfRe3MPC7Cy8gfe",
        initial_rate: 0.016718,
        expiration_time: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
        tag: 387226,
        tagName: "Destination tag",
        addressAlt: "X7oTDuA4BXetP9LkG7KtgDsPK9CdCkY4AJShwsCEHTBGYkB"
      };

      // Calculate time remaining for order expiration
      const expirationTime = new Date(staticOrderData.expiration_time);
      const now = new Date();
      const diffMs = expirationTime.getTime() - now.getTime();
      
      let timeRemaining = null;
      if (diffMs > 0) {
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);
        timeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
      }

      setOrderDetails({
        depositAddress: staticOrderData.deposit_address,
        depositAmount: staticOrderData.amount.toString(),
        currentStatus: staticOrderData.status,
        fromCurrency: staticOrderData.from_currency,
        toCurrency: staticOrderData.to_currency,
        orderId: staticOrderData.id,
        ffOrderId: staticOrderData.ff_order_id,
        ffOrderToken: staticOrderData.ff_order_token,
        destinationAddress: staticOrderData.destination_address,
        expiresAt: staticOrderData.expiration_time,
        timeRemaining,
        tag: staticOrderData.tag,
        tagName: staticOrderData.tagName,
        addressAlt: staticOrderData.addressAlt
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
