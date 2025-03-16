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
  // Use a ref to store the interval id so it doesn't trigger re-renders
  const pollingIntervalIdRef = useRef<number | null>(null);

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

          setOrderDetails({
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
          });

          // Stop further polling if a terminal status is reached
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
          orderType: orderType,
          receiveAmount: bridgeData.receiveAmount,
          fromCurrencyName: bridgeData.fromCurrencyName,
          toCurrencyName: bridgeData.toCurrencyName,
        });

        setLoading(false);
        return;
      }

      console.log("No stored bridge data found, using static data");
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
        orderType: fallbackData.type === "float" ? "float" : "fixed",
        receiveAmount: fallbackData.receiveAmount,
        fromCurrencyName: fallbackData.fromCurrencyName,
        toCurrencyName: fallbackData.toCurrencyName,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setLoading(false);
    }
  }, [orderId, shouldFetch, forceApiCheck]);

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
      // Set up polling every 15 seconds
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
