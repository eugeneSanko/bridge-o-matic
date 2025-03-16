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

      const storedDataStr = localStorage.getItem("bridge_transaction_data");
      let bridgeData = null;

      if (storedDataStr) {
        try {
          bridgeData = JSON.parse(storedDataStr);
          console.log("Found stored bridge data:", bridgeData);
        } catch (e) {
          console.error("Error parsing stored bridge data:", e);
        }
      }

      if ((!bridgeData || forceApiCheck) && !bridgeData?.orderToken) {
        console.log("Checking Supabase for order data");
        const supabaseData = await fetchOrderFromSupabase(orderId);
        
        if (supabaseData) {
          console.log("Using data from Supabase");
          
          bridgeData = {
            id: supabaseData.ff_order_id,
            orderToken: supabaseData.ff_order_token,
            fromCurrency: supabaseData.from_currency,
            toCurrency: supabaseData.to_currency,
            amount: supabaseData.amount.toString(),
            destinationAddress: supabaseData.destination_address,
            status: supabaseData.status,
            depositAddress: supabaseData.deposit_address,
            expiresAt: supabaseData.expiration_time,
          };
          
          localStorage.setItem("bridge_transaction_data", JSON.stringify(bridgeData));
        }
      }

      if ((bridgeData && bridgeData.orderToken) || forceApiCheck) {
        console.log("Fetching real-time order status from API");
        const apiRequestBody = {
          id: bridgeData?.id || orderId,
          token: bridgeData?.orderToken || orderId,
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

          const orderType: "fixed" | "float" =
            apiResponse.data.type?.toLowerCase() === "float"
              ? "float"
              : "fixed";

          if (bridgeData) {
            bridgeData.status = currentStatus;
            if (apiResponse.data.time && apiResponse.data.time.expiration) {
              const expirationTimestamp =
                apiResponse.data.time.expiration * 1000;
              bridgeData.expiresAt = new Date(
                expirationTimestamp
              ).toISOString();
            }
            localStorage.setItem(
              "bridge_transaction_data",
              JSON.stringify(bridgeData)
            );
          }

          const fromCurrencyName =
            apiResponse.data.from?.name || bridgeData?.fromCurrencyName;
          const toCurrencyName =
            apiResponse.data.to?.name || bridgeData?.toCurrencyName;

          const details = {
            depositAddress:
              bridgeData?.depositAddress || apiResponse.data.from.address,
            depositAmount: bridgeData?.amount || apiResponse.data.from.amount,
            currentStatus: currentStatus,
            fromCurrency:
              bridgeData?.fromCurrency || apiResponse.data.from.code,
            toCurrency: bridgeData?.toCurrency || apiResponse.data.to.code,
            orderId: apiResponse.data.id,
            ffOrderId: apiResponse.data.id,
            ffOrderToken:
              apiResponse.data.token || bridgeData?.orderToken || orderId,
            destinationAddress:
              bridgeData?.destinationAddress || apiResponse.data.to.address,
            expiresAt: apiResponse.data.time?.expiration
              ? new Date(apiResponse.data.time.expiration * 1000).toISOString()
              : bridgeData?.expiresAt,
            timeRemaining: apiResponse.data.time?.left
              ? calculateTimeRemaining(apiResponse.data.time.left)
              : calculateTimeRemaining(bridgeData?.expiresAt),
            tag: bridgeData?.tag || apiResponse.data.from.tag || null,
            tagName:
              bridgeData?.tagName || apiResponse.data.from.tagName || null,
            addressAlt:
              bridgeData?.addressAlt ||
              apiResponse.data.from.addressAlt ||
              null,
            orderType: orderType,
            receiveAmount:
              bridgeData?.receiveAmount || apiResponse.data.to.amount,
            fromCurrencyName: fromCurrencyName,
            toCurrencyName: toCurrencyName,
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
      }

      if (bridgeData) {
        const orderType: "fixed" | "float" =
          bridgeData.type?.toLowerCase() === "float" ? "float" : "fixed";

        const details = {
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
          orderType: orderType,
          receiveAmount: bridgeData.receiveAmount,
          fromCurrencyName: bridgeData.fromCurrencyName,
          toCurrencyName: bridgeData.toCurrencyName,
        };
        
        saveOrderToSupabase(details);

        setOrderDetails(details);
        setLoading(false);
        return;
      }

      console.log("No stored bridge data found or in Supabase, using static data");
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
        fromCurrencyName: "Tether USD",
        toCurrencyName: "Solana",
      };

      const details = {
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
        orderType: fallbackData.type === "float" ? "float" : "fixed",
        receiveAmount: fallbackData.receiveAmount,
        fromCurrencyName: fallbackData.fromCurrencyName,
        toCurrencyName: fallbackData.toCurrencyName,
      };

      setOrderDetails(details);
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
