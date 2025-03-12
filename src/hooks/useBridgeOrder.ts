
import { useState, useEffect, useCallback } from "react";
import { invokeFunctionWithRetry } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CompletedTransaction } from "@/types/bridge";

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
  fromCurrencyName?: string;
  toCurrencyName?: string;
  raw_api_response?: any;
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
  fromCurrencyName?: string;
  toCurrencyName?: string;
  rawApiResponse?: any;
}

// Statuses that should continue polling
const ACTIVE_POLLING_STATUSES = ['NEW', 'PENDING', 'EXCHANGE', 'WITHDRAW'];

// Terminal statuses that should stop polling
const TERMINAL_STATUSES = ['DONE', 'EXPIRED', 'EMERGENCY'];

export function useBridgeOrder(
  orderId: string | null, 
  shouldFetch: boolean = true,
  forceApiCheck: boolean = false
) {
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
      
      // Check completed transactions first
      const { data: completedTransaction, error: dbError } = await supabase
        .from('completed_bridge_transactions')
        .select('*')
        .eq('ff_order_id', orderId)
        .maybeSingle();
      
      if (dbError) {
        console.error("Error checking completed transactions:", dbError);
      } else if (completedTransaction) {
        console.log("Found completed transaction:", completedTransaction);
        
        // Cast the completedTransaction to our CompletedTransaction type 
        const typedTransaction = completedTransaction as unknown as CompletedTransaction;
        
        setOrderDetails({
          depositAddress: typedTransaction.deposit_address,
          depositAmount: typedTransaction.amount.toString(),
          currentStatus: "completed",
          fromCurrency: typedTransaction.from_currency,
          toCurrency: typedTransaction.to_currency,
          orderId: typedTransaction.ff_order_id,
          ffOrderId: typedTransaction.ff_order_id,
          ffOrderToken: typedTransaction.ff_order_token,
          destinationAddress: typedTransaction.destination_address,
          expiresAt: null,
          timeRemaining: null,
          orderType: 'fixed',
          rawApiResponse: typedTransaction.raw_api_response || {
            status: "DONE"
          }
        });
        setLoading(false);
        return;
      }
      
      // Get token from URL if not passed directly
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        throw new Error("Missing order token");
      }
      
      // Pass both id and token to bridge-status function
      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('bridge-status', {
        body: { 
          id: orderId,
          token: token 
        }
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
        
        const currentStatus = statusMap[apiStatus] || apiStatus.toLowerCase();
        
        // Ensure orderType is correctly typed
        const orderType: "fixed" | "float" = 
          apiResponse.data.type?.toLowerCase() === 'float' ? 'float' : 'fixed';
        
        // Extract currency names if available in the API response
        const fromCurrencyName = apiResponse.data.from?.name;
        const toCurrencyName = apiResponse.data.to?.name;
        
        // Set order details from API data
        setOrderDetails({
          depositAddress: apiResponse.data.from.address,
          depositAmount: apiResponse.data.from.amount,
          currentStatus: currentStatus,
          fromCurrency: apiResponse.data.from.code,
          toCurrency: apiResponse.data.to.code,
          orderId: apiResponse.data.id,
          ffOrderId: apiResponse.data.id,
          ffOrderToken: apiResponse.data.token,
          destinationAddress: apiResponse.data.to.address,
          expiresAt: apiResponse.data.time?.expiration ? 
                     new Date(apiResponse.data.time.expiration * 1000).toISOString() : 
                     null,
          timeRemaining: apiResponse.data.time?.left ? 
                         calculateTimeRemaining(apiResponse.data.time.left) : 
                         null,
          tag: apiResponse.data.from.tag || null,
          tagName: apiResponse.data.from.tagName || null,
          addressAlt: apiResponse.data.from.addressAlt || null,
          orderType: orderType,
          receiveAmount: apiResponse.data.to.amount,
          fromCurrencyName: fromCurrencyName,
          toCurrencyName: toCurrencyName,
          rawApiResponse: apiResponse.data
        });
        
        setLoading(false);
        return;
      }
      
      throw new Error("Invalid API response format");
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setLoading(false);
    }
  }, [orderId, shouldFetch]);

  const calculateTimeRemaining = (input: string | number | null): string | null => {
    if (input === null) return null;
    
    // If input is a number, treat it as seconds remaining
    if (typeof input === 'number') {
      const minutes = Math.floor(input / 60);
      const seconds = Math.floor(input % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Otherwise treat as ISO string date
    const expirationTime = new Date(input);
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
    handleCopyAddress,
    fetchOrderDetails,
    ACTIVE_POLLING_STATUSES,
    TERMINAL_STATUSES
  };
}
