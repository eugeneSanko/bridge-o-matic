
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  fromCurrencyName?: string;
  toCurrencyName?: string;
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
  rawApiResponse?: any; // Store raw API response for debugging
}

export function useBridgeOrder(
  orderId: string | null,
  shouldFetch: boolean = true,
  forceApiCheck: boolean = false
) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalIdRef = useRef<number | null>(null);

  const saveOrderToSupabase = useCallback(async (details: OrderDetails) => {
    if (!details || !details.orderId) return null;

    try {
      console.log("Saving order details to Supabase:", details.orderId);
      
      const { data: existingOrder, error: checkError } = await supabase
        .from('bridge_transactions')
        .select('id')
        .eq('ff_order_id', details.orderId)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking existing order:", checkError);
        return null;
      }
      
      if (existingOrder && existingOrder.length > 0) {
        const { data, error: updateError } = await supabase
          .from('bridge_transactions')
          .update({
            status: details.currentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('ff_order_id', details.orderId)
          .select();
        
        if (updateError) {
          console.error("Error updating order in Supabase:", updateError);
          return null;
        }
        
        console.log("Updated order in Supabase:", data);
        return data?.[0] || null;
      } 
      else {
        const { data, error: insertError } = await supabase
          .from('bridge_transactions')
          .insert([{
            ff_order_id: details.orderId,
            ff_order_token: details.ffOrderToken,
            from_currency: details.fromCurrency,
            to_currency: details.toCurrency,
            amount: parseFloat(details.depositAmount),
            destination_address: details.destinationAddress,
            status: details.currentStatus,
            deposit_address: details.depositAddress,
            expiration_time: details.expiresAt,
            client_metadata: {
              device: navigator.userAgent,
              time: new Date().toISOString()
            }
          }])
          .select();
        
        if (insertError) {
          console.error("Error inserting order to Supabase:", insertError);
          return null;
        }
        
        console.log("Inserted order to Supabase:", data);
        return data?.[0] || null;
      }
    } catch (err) {
      console.error("Error saving to Supabase:", err);
      return null;
    }
  }, []);

  const fetchOrderFromSupabase = useCallback(async (orderIdentifier: string) => {
    try {
      console.log("Fetching order from Supabase:", orderIdentifier);
      
      const { data, error } = await supabase
        .from('bridge_transactions')
        .select('*')
        .or(`ff_order_id.eq.${orderIdentifier},id.eq.${orderIdentifier}`)
        .limit(1);
      
      if (error) {
        console.error("Error fetching from Supabase:", error);
        return null;
      }
      
      if (data && data.length > 0) {
        console.log("Found order in Supabase:", data[0]);
        return data[0];
      }
      
      console.log("Order not found in Supabase");
      return null;
    } catch (err) {
      console.error("Error querying Supabase:", err);
      return null;
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !shouldFetch) {
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching order details for", orderId);

      // First check Supabase for order token if we don't have it
      let orderToken = null;
      const supabaseData = await fetchOrderFromSupabase(orderId);
      
      if (supabaseData) {
        console.log("Found order data in Supabase");
        orderToken = supabaseData.ff_order_token;
      }

      // Always fetch from the API to get the most up-to-date status
      console.log("Fetching real-time order status from API");
      const apiRequestBody = {
        id: orderId,
        token: orderToken || orderId,
      };

      console.log("API request parameters:", apiRequestBody);

      const { data: apiResponse, error: apiError } =
        await supabase.functions.invoke("bridge-status", {
          body: apiRequestBody,
        });

      if (apiError) {
        console.error("API error when fetching order status:", apiError);
        throw new Error(`API error: ${apiError.message}`);
      }

      if (apiResponse && apiResponse.code === 0 && apiResponse.data) {
        console.log("API returned order status:", apiResponse);
        const apiStatus = apiResponse.data.status;
        console.log("Raw API status:", apiStatus);

        const statusMap: Record<string, string> = {
          NEW: "pending",
          PENDING: "processing",
          EXCHANGE: "exchanging",
          WITHDRAW: "sending",
          DONE: "completed",
          EXPIRED: "expired",
          EMERGENCY: "failed",
        };

        const currentStatus = statusMap[apiStatus] || apiStatus.toLowerCase();
        console.log("Mapped status:", currentStatus);

        // Ensure orderType is "fixed" | "float"
        const orderType: "fixed" | "float" =
          apiResponse.data.type?.toLowerCase() === "float"
            ? "float"
            : "fixed";

        const details: OrderDetails = {
          depositAddress: apiResponse.data.from.address,
          depositAmount: apiResponse.data.from.amount,
          currentStatus: currentStatus,
          fromCurrency: apiResponse.data.from.code,
          toCurrency: apiResponse.data.to.code,
          orderId: apiResponse.data.id,
          ffOrderId: apiResponse.data.id,
          ffOrderToken: apiResponse.data.token || orderToken || orderId,
          destinationAddress: apiResponse.data.to.address,
          expiresAt: apiResponse.data.time?.expiration
            ? new Date(apiResponse.data.time.expiration * 1000).toISOString()
            : null,
          timeRemaining: apiResponse.data.time?.left
            ? calculateTimeRemaining(apiResponse.data.time.left)
            : null,
          tag: apiResponse.data.from.tag || null,
          tagName: apiResponse.data.from.tagName || null,
          addressAlt: apiResponse.data.from.addressAlt || null,
          orderType: orderType,
          receiveAmount: apiResponse.data.to.amount,
          fromCurrencyName: apiResponse.data.from.name,
          toCurrencyName: apiResponse.data.to.name,
          rawApiResponse: apiResponse.data,
        };
        
        saveOrderToSupabase(details);
        setOrderDetails(details);

        if (
          apiResponse.data.status === "EXPIRED" ||
          apiResponse.data.status === "EMERGENCY" ||
          apiResponse.data.status === "DONE"
        ) {
          console.log(
            "Terminal status received. Stopping polling in 1500ms."
          );
          setTimeout(() => {
            if (pollingIntervalIdRef.current) {
              clearInterval(pollingIntervalIdRef.current);
              pollingIntervalIdRef.current = null;
            }
          }, 1500);
        }

        setLoading(false);
        return;
      }

      // If API call fails or doesn't return data, display an error
      setError("Could not fetch order details from the API");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setLoading(false);
    }
  }, [orderId, shouldFetch, forceApiCheck, fetchOrderFromSupabase, saveOrderToSupabase]);

  const calculateTimeRemaining = (
    input: string | number | null
  ): string | null => {
    if (input === null) return null;
    if (typeof input === "number") {
      const minutes = Math.floor(input / 60);
      const seconds = Math.floor(input % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    const expirationTime = new Date(input);
    const now = new Date();
    const diffMs = expirationTime.getTime() - now.getTime();
    if (diffMs <= 0) {
      return "0:00";
    }
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
    if (shouldFetch && orderId) {
      pollingIntervalIdRef.current = window.setInterval(
        fetchOrderDetails,
        15000
      );
      return () => {
        if (pollingIntervalIdRef.current) {
          clearInterval(pollingIntervalIdRef.current);
          pollingIntervalIdRef.current = null;
        }
      };
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
        setOrderDetails((prev) =>
          prev ? { ...prev, timeRemaining: "0:00" } : null
        );
        return;
      }
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      const newTimeRemaining = `${diffMinutes}:${diffSeconds
        .toString()
        .padStart(2, "0")}`;
      setOrderDetails((prev) =>
        prev ? { ...prev, timeRemaining: newTimeRemaining } : null
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [orderDetails?.expiresAt]);

  const handleCopyAddress = (text: string) => {
    navigator.clipboard
      .writeText(text)
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
          variant: "destructive",
        });
      });
  };

  return {
    orderDetails,
    loading,
    error,
    handleCopyAddress,
  };
}
