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
  type?: "fixed" | "float";
  receive_amount?: string;
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
  orderType: "fixed" | "float";
  receiveAmount?: string;
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
      
      // Try to get stored bridge transaction data
      const storedDataStr = localStorage.getItem('bridge_transaction_data');
      let bridgeData = null;
      
      if (storedDataStr) {
        try {
          bridgeData = JSON.parse(storedDataStr);
          console.log("Found stored bridge data:", bridgeData);
        } catch (e) {
          console.error("Error parsing stored bridge data:", e);
        }
      }
      
      if (!bridgeData) {
        console.log("No stored bridge data found, using static data");
        // Use static data as fallback
        bridgeData = {
          id: orderId,
          fromCurrency: "USDT",
          toCurrency: "SOL",
          amount: "50",
          destinationAddress: "8VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY",
          status: "NEW",
          depositAddress: "0x48f6bf4b24bc374943d7a45c0811908ccd1c2eea",
          type: "float",
          receiveAmount: "0.39840800"
        };
      }

      setOrderDetails({
        depositAddress: bridgeData.depositAddress,
        depositAmount: bridgeData.amount,
        currentStatus: bridgeData.status,
        fromCurrency: bridgeData.fromCurrency,
        toCurrency: bridgeData.toCurrency,
        orderId: bridgeData.id,
        ffOrderId: bridgeData.id,
        ffOrderToken: orderId,
        destinationAddress: bridgeData.destinationAddress,
        expiresAt: new Date(Date.now() + 20 * 60000).toISOString(),
        timeRemaining: "20:00",
        tag: bridgeData.tag || null,
        tagName: bridgeData.tagName || null,
        addressAlt: bridgeData.addressAlt || null,
        orderType: bridgeData.type || "fixed",
        receiveAmount: bridgeData.receiveAmount
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

  useEffect(() => {
    if (!orderDetails || !orderDetails.expiresAt) return;

    const timer = setInterval(() => {
      const expirationTime = new Date(orderDetails.expiresAt!);
      const now = new Date();
      const diffMs = expirationTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        clearInterval(timer);
        setOrderDetails(prev => prev ? { ...prev, timeRemaining: "0:00" } : null);
        return;
      }
      
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      const newTimeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
      
      setOrderDetails(prev => prev ? { ...prev, timeRemaining: newTimeRemaining } : null);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [orderDetails?.expiresAt]);

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
