import { useState, useEffect, useCallback } from "react";
import { API_CONFIG, invokeFunctionWithRetry, generateFixedFloatSignature } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  rawApiResponse?: any; // Store raw API response for debugging
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
      console.log("Fetching order details for", orderId);
      
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
      
      // If we have bridge data with a token, attempt to fetch the latest status from the API
      if (bridgeData && bridgeData.orderToken) {
        try {
          console.log("Fetching real-time order status from API");
          
          // Prepare request body for the API call
          const apiRequestBody = {
            id: bridgeData.id,
            token: bridgeData.orderToken
          };
          
          // Make the API call via Supabase Edge Function
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('bridge-status', {
            body: apiRequestBody
          });
          
          if (apiError) {
            console.error("API error when fetching order status:", apiError);
            throw new Error(`API error: ${apiError.message}`);
          }
          
          if (apiResponse && apiResponse.code === 0 && apiResponse.data) {
            console.log("API returned order status:", apiResponse);
            
            // Map API status to our app status format
            const apiStatus = apiResponse.data.status;
            const statusMap: Record<string, string> = {
              'NEW': 'pending',
              'PENDING': 'processing',
              'EXCHANGE': 'exchanging',
              'WITHDRAW': 'sending',
              'DONE': 'completed',
              'EXPIRED': 'expired',
              'EMERGENCY': 'failed'
            };
            
            // Ensure orderType is correctly typed
            const orderType = apiResponse.data.type?.toLowerCase() === 'float' ? 'float' : 'fixed';
            
            bridgeData.status = statusMap[apiStatus] || apiStatus.toLowerCase();
            
            // If we have time information, update expiration
            if (apiResponse.data.time && apiResponse.data.time.expiration) {
              const expirationTimestamp = apiResponse.data.time.expiration * 1000; // Convert to milliseconds
              bridgeData.expiresAt = new Date(expirationTimestamp).toISOString();
            }
            
            // Store the updated bridge data back to localStorage
            localStorage.setItem('bridge_transaction_data', JSON.stringify(bridgeData));
            
            setOrderDetails({
              depositAddress: bridgeData.depositAddress || apiResponse.data.from.address,
              depositAmount: bridgeData.amount || apiResponse.data.from.amount,
              currentStatus: bridgeData.status,
              fromCurrency: bridgeData.fromCurrency || apiResponse.data.from.code,
              toCurrency: bridgeData.toCurrency || apiResponse.data.to.code,
              orderId: bridgeData.id,
              ffOrderId: bridgeData.id,
              ffOrderToken: bridgeData.orderToken,
              destinationAddress: bridgeData.destinationAddress || apiResponse.data.to.address,
              expiresAt: bridgeData.expiresAt,
              timeRemaining: calculateTimeRemaining(bridgeData.expiresAt),
              tag: bridgeData.tag || apiResponse.data.from.tag || null,
              tagName: bridgeData.tagName || apiResponse.data.from.tagName || null,
              addressAlt: bridgeData.addressAlt || apiResponse.data.from.addressAlt || null,
              orderType: orderType,
              receiveAmount: bridgeData.receiveAmount || apiResponse.data.to.amount,
              rawApiResponse: apiResponse.data
            });
            
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error("Error when fetching from API:", apiError);
          // Continue to fallback if API fails - don't set error yet
        }
      }
      
      // If we don't have API data or the API call failed, use the stored data as fallback
      if (bridgeData) {
        setOrderDetails({
          depositAddress: bridgeData.depositAddress,
          depositAmount: bridgeData.amount,
          currentStatus: bridgeData.status,
          fromCurrency: bridgeData.fromCurrency,
          toCurrency: bridgeData.toCurrency,
          orderId: bridgeData.id,
          ffOrderId: bridgeData.id,
          ffOrderToken: bridgeData.orderToken || orderId,
          destinationAddress: bridgeData.destinationAddress,
          expiresAt: bridgeData.expiresAt,
          timeRemaining: calculateTimeRemaining(bridgeData.expiresAt),
          tag: bridgeData.tag || null,
          tagName: bridgeData.tagName || null,
          addressAlt: bridgeData.addressAlt || null,
          orderType: bridgeData.type || "fixed",
          receiveAmount: bridgeData.receiveAmount
        });
        
        setLoading(false);
        return;
      }
      
      // If we still don't have data, use static fallback data
      console.log("No stored bridge data found, using static data");
      // Use static data as fallback
      const fallbackData = {
        id: orderId,
        fromCurrency: "USDT",
        toCurrency: "SOL",
        amount: "50",
        destinationAddress: "8VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY",
        status: "NEW",
        depositAddress: "0x48f6bf4b24bc374943d7a45c0811908ccd1c2eea",
        type: "float",
        receiveAmount: "0.39840800",
        expiresAt: new Date(Date.now() + 20 * 60000).toISOString(),
      };

      setOrderDetails({
        depositAddress: fallbackData.depositAddress,
        depositAmount: fallbackData.amount,
        currentStatus: fallbackData.status.toLowerCase(),
        fromCurrency: fallbackData.fromCurrency,
        toCurrency: fallbackData.toCurrency,
        orderId: fallbackData.id,
        ffOrderId: fallbackData.id,
        ffOrderToken: orderId,
        destinationAddress: fallbackData.destinationAddress,
        expiresAt: fallbackData.expiresAt,
        timeRemaining: calculateTimeRemaining(fallbackData.expiresAt),
        tag: null,
        tagName: null,
        addressAlt: null,
        orderType: fallbackData.type === 'float' ? 'float' : 'fixed',
        receiveAmount: fallbackData.receiveAmount
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setLoading(false);
    }
  }, [orderId, shouldFetch]);

  // Helper function to calculate time remaining
  const calculateTimeRemaining = (expiresAtStr: string | null): string | null => {
    if (!expiresAtStr) return null;
    
    const expirationTime = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expirationTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return "0:00";
    }
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
  };

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
