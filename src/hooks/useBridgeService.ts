
import { useState, useCallback } from 'react';
import { API_CONFIG, generateFixedFloatSignature } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { PriceResponse, BridgeError, Currency, ApiOrderResponse, OrderResponse } from "@/types/bridge";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

// Create a specialized logger for this service
const bridgeLogger = logger;

const MOCK_CURRENCIES: Currency[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    image: "https://ff.io/static/currencies/btc.svg",
    network: "Bitcoin",
    available: true,
    color: "#F7931A",
    coin: "btc",
    code: "BTC",
    send: 1,
    recv: 1
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    image: "https://ff.io/static/currencies/eth.svg",
    network: "Ethereum",
    available: true,
    color: "#627EEA",
    coin: "eth",
    code: "ETH",
    send: 1,
    recv: 1
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    image: "https://ff.io/static/currencies/usdt.svg",
    network: "Ethereum",
    available: true,
    color: "#26A17B",
    coin: "usdt",
    code: "USDTETH",
    send: 1,
    recv: 1
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    image: "https://ff.io/static/currencies/usdc.svg",
    network: "Ethereum",
    available: true,
    color: "#2775CA",
    coin: "usdc",
    code: "USDCETH",
    send: 1,
    recv: 1
  },
  {
    symbol: "SOL",
    name: "Solana",
    image: "https://ff.io/static/currencies/sol.svg",
    network: "Solana",
    available: true,
    color: "#00ffbd",
    coin: "sol",
    code: "SOL",
    send: 1,
    recv: 1
  }
];

export function useBridgeService() {
  const [lastPriceCheck, setLastPriceCheck] = useState<PriceResponse | null>(null);
  
  const generateApiSignature = (body: any = {}) => {
    return generateFixedFloatSignature(body);
  };
  
  const fetchCurrencies = useCallback(async () => {
    try {
      bridgeLogger.info('Fetching available currencies from FixedFloat API via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('bridge-currencies');
      
      if (error) {
        bridgeLogger.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data) {
        bridgeLogger.error('No data returned from edge function');
        throw new Error('No data returned from edge function');
      }
      
      bridgeLogger.debug('Edge function response:', data);
      
      if (data.code === 0 && data.data && Array.isArray(data.data)) {
        const currenciesArray: Currency[] = data.data.map((currency: any) => ({
          symbol: currency.code,
          name: currency.name || '',
          image: currency.logo || null,
          network: currency.network || null,
          available: (currency.send === 1 || currency.recv === 1),
          color: currency.color || null,
          coin: currency.coin?.toLowerCase() || '',
          code: currency.code || '',
          logo: currency.logo || null,
          recv: currency.recv || 0,
          send: currency.send || 0,
          tag: currency.tag || null,
          priority: currency.priority || 0
        }));
        
        return currenciesArray;
      } else {
        bridgeLogger.error('API returned an error or unexpected format:', data);
        throw new Error(data.msg || 'Unknown API error');
      }
    } catch (error) {
      bridgeLogger.error('Error fetching currencies:', error);
      
      bridgeLogger.warn('Falling back to mock currency data due to API error');
      toast({
        title: "API Error",
        description: "Could not connect to exchange API. Using fallback data.",
        variant: "destructive"
      });
      
      return MOCK_CURRENCIES;
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
        orderType
      };
      
      bridgeLogger.info('Calculating price via Supabase Edge Function...');
      bridgeLogger.debug('API Request:', body);
      
      const { data, error } = await supabase.functions.invoke('bridge-price', {
        body
      });
      
      if (error) {
        bridgeLogger.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data) {
        bridgeLogger.error('No data returned from edge function');
        throw new Error('No data returned from edge function');
      }
      
      bridgeLogger.debug('Price calculation response:', data);
      
      if (data.code === 0) {
        const responseData: PriceResponse = {
          code: data.code,
          msg: data.msg,
          data: data.data,
          timestamp: data.timestamp,
          expiresAt: data.expiresAt
        };
        
        setLastPriceCheck(responseData);
        return responseData;
      } else {
        bridgeLogger.error('API returned an error:', data);
        throw new Error(data.msg || 'Unknown API error');
      }
    } catch (error) {
      bridgeLogger.error('Error calculating amount:', error);
      
      bridgeLogger.warn('Generating mock price data due to API error');
      
      const mockRate = fromCurrency === 'BTC' ? 65000 : 3000;
      const fromAmount = parseFloat(amount);
      const toAmount = fromCurrency === 'BTC' 
        ? (fromAmount * mockRate).toFixed(2) 
        : (fromAmount / mockRate).toFixed(8);
      
      const mockResponse: PriceResponse = {
        code: 0,
        msg: "Success",
        data: {
          from: {
            amount: amount,
            currency: fromCurrency,
            max: "10",
            min: "0.001",
            network: "Network",
            rate: (fromCurrency === 'BTC' ? mockRate : 1 / mockRate).toString(),
            usd: fromAmount * mockRate,
            btc: fromCurrency === 'BTC' ? fromAmount : fromAmount / mockRate
          },
          to: {
            amount: toAmount,
            currency: toCurrency,
            max: "1000000",
            min: "0.01",
            network: "Network",
            rate: (fromCurrency === 'BTC' ? 1 / mockRate : mockRate).toString(),
            usd: parseFloat(toAmount) * (toCurrency === 'BTC' ? mockRate : 1),
            btc: toCurrency === 'BTC' ? parseFloat(toAmount) : parseFloat(toAmount) / mockRate
          },
          errors: []
        },
        timestamp: Date.now() / 1000,
        expiresAt: (Date.now() / 1000) + 60
      };
      
      setLastPriceCheck(mockResponse);
      return mockResponse;
    }
  }, []);

  const createOrder = useCallback(async (
    fromCurrency: string, 
    toCurrency: string, 
    amount: string, 
    destination: string, 
    orderType: 'fixed' | 'float',
    initialRate: string
  ): Promise<OrderResponse> => {
    try {
      // Set affiliation parameters
      const affTax = orderType === "fixed" ? 1.0 : 0.5;  // 1% for fixed, 0.5% for float
      const refCode = "tradenly";  // Use the same refcode as in the price function
      
      const body = {
        fromCcy: fromCurrency,
        toCcy: toCurrency,
        amount: amount,
        direction: "from",
        type: orderType,
        toAddress: destination,
        refcode: refCode,
        afftax: affTax
      };
      
      bridgeLogger.info('Creating bridge order with parameters:', body);
      
      const { data, error } = await supabase.functions.invoke('bridge-create', {
        body
      });
      
      if (error) {
        bridgeLogger.error('Edge function error:', error);
        return {
          orderId: '',
          code: 500,
          msg: `Edge function error: ${error.message}`
        };
      }
      
      if (!data) {
        bridgeLogger.error('No data returned from edge function');
        return {
          orderId: '',
          code: 500,
          msg: 'No data returned from edge function'
        };
      }
      
      bridgeLogger.debug('Order creation response:', data);
      
      if (data.code === 0 && data.data) {
        return { 
          orderId: data.data.id || '', 
          orderToken: data.data.token || '',
          code: data.code,
          msg: data.msg,
          data: data.data,
          debugInfo: data.debugInfo
        };
      } else {
        bridgeLogger.error('API returned an error:', data);
        return {
          orderId: '',
          code: data.code || 500,
          msg: data.msg || 'Unknown API error',
          debugInfo: data.debugInfo
        };
      }
    } catch (error) {
      bridgeLogger.error('Bridge transaction error:', error);
      
      if (import.meta.env.DEV) {
        bridgeLogger.warn('Generating mock order data due to API error');
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 301) {
          return {
            orderId: '',
            code: 301,
            msg: 'Invalid address',
            debugInfo: { error }
          };
        }
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 500) {
          return {
            orderId: '',
            code: 500,
            msg: 'Order not found',
            debugInfo: { error }
          };
        }
        
        const mockOrderId = `FF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const mockOrderToken = `${Math.random().toString(36).substring(2, 30)}`;
        
        return { 
          orderId: mockOrderId,
          orderToken: mockOrderToken,
          code: 0,
          msg: 'Success',
          data: {
            id: mockOrderId,
            token: mockOrderToken,
            type: orderType,
            status: "NEW",
            from: {
              address: "0x48f6bf4b24bc374943d7a45c0811908ccd1c2eea",
              tag: null,
              tagName: null,
              addressAlt: null
            },
            to: {
              address: destination
            },
            time: {
              expiration: Math.floor(Date.now() / 1000) + 1200
            }
          }
        };
      }
      
      return {
        orderId: '',
        code: 500,
        msg: error instanceof Error ? error.message : String(error),
        debugInfo: { error }
      };
    }
  }, []);

  const checkOrderStatus = useCallback(async (orderId: string) => {
    try {
      const body = { orderId };
      
      const signature = generateApiSignature(body);
      
      bridgeLogger.info('Simulating order status check due to CORS restrictions');
      bridgeLogger.debug('API Request would include:', body);
      bridgeLogger.debug('API Signature:', signature);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        code: 0,
        msg: "Success",
        status: "waiting",
        details: {
          from: {
            address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            amount: "0.01",
            currency: "BTC"
          },
          to: {
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            amount: "230.45",
            currency: "USDT"
          },
          expiration: (Date.now() / 1000) + 3600
        }
      };
    } catch (error) {
      bridgeLogger.error('Error checking order status:', error);
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
