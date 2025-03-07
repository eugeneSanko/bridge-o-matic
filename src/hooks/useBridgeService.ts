
import { useState, useCallback } from 'react';
import { API_CONFIG } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { PriceResponse, BridgeError, Currency } from "@/types/bridge";
import CryptoJS from 'crypto-js';

// Mock data for development (since we can't call the API directly due to CORS)
const MOCK_CURRENCIES: Currency[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    image: "https://ff.io/static/currencies/btc.svg",
    network: "Bitcoin",
    available: true,
    color: "#F7931A",
    coin: "btc"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    image: "https://ff.io/static/currencies/eth.svg",
    network: "Ethereum",
    available: true,
    color: "#627EEA",
    coin: "eth"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    image: "https://ff.io/static/currencies/usdt.svg",
    network: "Ethereum",
    available: true,
    color: "#26A17B",
    coin: "usdt"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    image: "https://ff.io/static/currencies/usdc.svg",
    network: "Ethereum",
    available: true,
    color: "#2775CA",
    coin: "usdc"
  },
  {
    symbol: "SOL",
    name: "Solana",
    image: "https://ff.io/static/currencies/sol.svg",
    network: "Solana",
    available: true,
    color: "#00ffbd",
    coin: "sol"
  }
];

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
      
      // CORS ISSUE: In a production environment, this should be handled by a backend proxy
      // For development, we'll use mock data
      console.log('Using mock currency data due to CORS restrictions');
      console.log('In production, this should be handled by a backend service that can make the API call');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return MOCK_CURRENCIES;
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
      
      // Generate signature for the request body
      const signature = generateApiSignature(body);
      
      // CORS ISSUE: In a production environment, this should be handled by a backend proxy
      // For development, we'll simulate a response
      console.log('Simulating price calculation due to CORS restrictions');
      console.log('API Request would include:', body);
      console.log('API Signature:', signature);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response based on the request
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
            network: "Network"
          },
          to: {
            amount: toAmount,
            currency: toCurrency,
            max: "1000000",
            min: "0.01",
            network: "Network"
          },
          rate: (fromCurrency === 'BTC' ? mockRate : 1 / mockRate).toString()
        },
        timestamp: Date.now() / 1000,
        expiresAt: (Date.now() / 1000) + 60
      };
      
      setLastPriceCheck(mockResponse);
      return mockResponse;
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
      
      // Generate signature for the request body
      const signature = generateApiSignature(body);
      
      // CORS ISSUE: In a production environment, this should be handled by a backend proxy
      // For development, we'll simulate a response
      console.log('Simulating order creation due to CORS restrictions');
      console.log('API Request would include:', body);
      console.log('API Signature:', signature);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock order ID
      const mockOrderId = `FF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      toast({
        title: "Development Mode",
        description: "In production, this would create a real order with the FixedFloat API",
      });
      
      return { orderId: mockOrderId };
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
      
      // Generate signature for the request body
      const signature = generateApiSignature(body);
      
      // CORS ISSUE: In a production environment, this should be handled by a backend proxy
      // For development, we'll simulate a response
      console.log('Simulating order status check due to CORS restrictions');
      console.log('API Request would include:', body);
      console.log('API Signature:', signature);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock status response with a specific address for the destination
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
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Mock destination address
            amount: "230.45",
            currency: "USDT"
          },
          expiration: (Date.now() / 1000) + 3600
        }
      };
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
