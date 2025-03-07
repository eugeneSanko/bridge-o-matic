import { useState, useCallback } from 'react';
import { API_CONFIG } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { PriceResponse, BridgeError, Currency } from "@/types/bridge";
import CryptoJS from 'crypto-js';

export function useBridgeService() {
  const [lastPriceCheck, setLastPriceCheck] = useState<PriceResponse | null>(null);
  
  const generateApiSignature = (body: any = {}) => {
    // Convert the body to a string if it's not empty, or use an empty string
    const bodyString = Object.keys(body).length ? JSON.stringify(body) : '{}';
    
    // Generate HMAC SHA256 signature with the API secret
    const signature = CryptoJS.HmacSHA256(bodyString, API_CONFIG.FF_API_SECRET).toString();
    
    console.log('Generated API signature:', signature);
    return signature;
  };
  
  const fetchCurrencies = useCallback(async () => {
    try {
      console.log('Fetching available currencies from FixedFloat API...');
      
      // Generate signature with empty body
      const signature = generateApiSignature();
      
      // Make direct fetch request to the API
      const response = await fetch('https://ff.io/api/v2/ccies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': API_CONFIG.FF_API_KEY,
          'X-API-SIGN': signature
        },
        body: '{}' // Empty JSON object as string
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Currency API response:', data);
      
      if (data.code === 0) {
        // Transform the raw data from FixedFloat API to our expected format
        const currencies = data.data.map((currency: any) => {
          return {
            symbol: currency.code,
            name: currency.name,
            image: currency.logo || null,
            network: currency.network || null,
            available: (currency.recv === 1 && currency.send === 1),
            color: currency.color || "#ffffff",
            coin: currency.coin || "",
            tag: currency.tag || null,
            priority: currency.priority || 0
          };
        }).filter((currency: Currency) => currency.available); // Only include available currencies
        
        console.log('Successfully loaded currencies:', currencies.length);
        return currencies;
      } else {
        console.error('Currency API returned error:', data.msg);
        throw new Error(data.msg || 'Failed to fetch currencies');
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast({
        title: "Error",
        description: "Failed to load available currencies",
        variant: "destructive"
      });
      // Return an empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }, []);

  const calculatePrice = useCallback(async (
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    orderType: 'fixed' | 'float'
  ) => {
    if (!fromCurrency || !toCurrency || !amount || parseFloat(amount) <= 0) {
      return null;
    }

    try {
      const body = {
        fromCurrency,
        toCurrency,
        amount,
        type: orderType
      };
      
      const data = await invokeFunctionWithRetry(API_CONFIG.FF_PRICE, {
        body
      });
      
      if (data.code !== 0) {
        throw new Error(data.msg || 'Failed to calculate price');
      }
      
      if (lastPriceCheck && data.data.rate) {
        const rateChange = Math.abs(
          (parseFloat(data.data.rate) - parseFloat(lastPriceCheck.data.rate)) / 
          parseFloat(lastPriceCheck.data.rate)
        );
        
        if (rateChange > 0.05) {
          throw new Error('Exchange rate has changed significantly. Please try again.');
        }
      }
      
      setLastPriceCheck(data);
      return data;
    } catch (error) {
      console.error('Error calculating amount:', error);
      toast({
        title: "Calculation Error",
        description: error instanceof Error ? error.message : "Failed to calculate estimated amount",
        variant: "destructive"
      });
      return null;
    }
  }, [lastPriceCheck]);

  const createOrder = useCallback(async (
    fromCurrency: string, 
    toCurrency: string, 
    amount: string, 
    destination: string, 
    orderType: 'fixed' | 'float',
    initialRate: string
  ) => {
    try {
      const body = {
        fromCurrency,
        toCurrency,
        amount,
        destination,
        type: orderType,
        initialRate
      };
      
      const data = await invokeFunctionWithRetry(API_CONFIG.FF_ORDER, {
        body
      });
      
      if (data.code !== 0) {
        throw new Error(data.msg || 'Failed to create bridge transaction');
      }

      return { orderId: data.data.orderId };
    } catch (error) {
      const bridgeError = error as BridgeError;
      toast({
        title: "Transaction Failed",
        description: bridgeError.message || "Failed to create bridge transaction",
        variant: "destructive"
      });
      console.error('Bridge transaction error:', error);
      return null;
    }
  }, []);

  const checkOrderStatus = useCallback(async (orderId: string) => {
    try {
      const body = { orderId };
      
      const data = await invokeFunctionWithRetry(API_CONFIG.FF_STATUS, {
        body
      });

      if (data.code !== 0) {
        throw new Error(data.msg || 'Failed to fetch order status');
      }

      return data;
    } catch (error) {
      console.error('Error checking order status:', error);
      return null;
    }
  }, []);

  return {
    fetchCurrencies,
    calculatePrice,
    createOrder,
    checkOrderStatus,
    lastPriceCheck
  };
}
