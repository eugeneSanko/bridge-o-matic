
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  img: string;
  testnet?: boolean;
}

export interface BridgeContextType {
  fromCurrency: Currency | null;
  toCurrency: Currency | null;
  amount: string;
  estimatedReceiveAmount: string;
  destinationAddress: string;
  orderType: 'fixed' | 'float';
  timeRemaining: number;
  isCalculating: boolean;
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
  setFromCurrency: (currency: Currency | null) => void;
  setToCurrency: (currency: Currency | null) => void;
  setAmount: (amount: string) => void;
  setDestinationAddress: (address: string) => void;
  setOrderType: (type: 'fixed' | 'float') => void;
  createBridgeTransaction: () => Promise<any>;
}

const BridgeContext = createContext<BridgeContextType | undefined>(undefined);

// Sample cryptocurrency data
const SAMPLE_CURRENCIES: Currency[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', img: '/bitcoin.svg' },
  { id: '2', name: 'Ethereum', symbol: 'ETH', img: '/ethereum.svg' },
  { id: '3', name: 'Solana', symbol: 'SOL', img: '/solana.svg' },
  { id: '4', name: 'USD Coin', symbol: 'USDC', img: '/usdc.svg' },
  { id: '5', name: 'Tether', symbol: 'USDT', img: '/tether.svg' },
  { id: '6', name: 'Binance Coin', symbol: 'BNB', img: '/bnb.svg' },
  { id: '7', name: 'BTC Testnet', symbol: 'tBTC', img: '/bitcoin.svg', testnet: true },
];

// Mock API function
const mockApiCall = <T,>(data: T, delay = 1000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
  const [toCurrency, setToCurrency] = useState<Currency | null>(null);
  const [amount, setAmount] = useState("");
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [orderType, setOrderType] = useState<'fixed' | 'float'>('fixed');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isCalculating, setIsCalculating] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  useEffect(() => {
    // Simulate fetching available currencies
    const fetchCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true);
        const currencies = await mockApiCall(SAMPLE_CURRENCIES, 1500);
        setAvailableCurrencies(currencies);
      } catch (error) {
        console.error("Failed to fetch currencies", error);
        toast({
          title: "Error",
          description: "Failed to load available currencies",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Calculate estimated receive amount when amount or currencies change
  useEffect(() => {
    if (!fromCurrency || !toCurrency || !amount || parseFloat(amount) <= 0) {
      setEstimatedReceiveAmount("");
      return;
    }

    const calculateEstimate = async () => {
      setIsCalculating(true);
      setTimeRemaining(30);
      
      try {
        // Simulate API calculation with random exchange rate
        const exchangeRate = Math.random() * 20;
        await mockApiCall(null, 1200);
        const estimated = (parseFloat(amount) * exchangeRate).toFixed(6);
        setEstimatedReceiveAmount(estimated);
      } catch (error) {
        console.error("Failed to calculate estimate", error);
        setEstimatedReceiveAmount("");
        toast({
          title: "Error",
          description: "Failed to calculate estimated amount",
          variant: "destructive"
        });
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEstimate();

    // Start countdown timer
    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [fromCurrency, toCurrency, amount]);

  // Refresh estimate when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && fromCurrency && toCurrency && amount) {
      // Trigger recalculation
      const amountValue = amount;
      setAmount("");
      setTimeout(() => setAmount(amountValue), 100);
    }
  }, [timeRemaining, fromCurrency, toCurrency, amount]);

  const createBridgeTransaction = useCallback(async () => {
    if (!fromCurrency || !toCurrency || !amount || !destinationAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to continue",
        variant: "destructive"
      });
      return null;
    }

    try {
      toast({
        title: "Creating transaction",
        description: "Please wait while we set up your bridge transaction",
      });

      // Simulate API call to create bridge transaction
      const response = await mockApiCall({
        orderId: `order-${Date.now()}`,
        fromCurrency: fromCurrency.symbol,
        toCurrency: toCurrency.symbol,
        amount: parseFloat(amount),
        estimatedReceiveAmount: parseFloat(estimatedReceiveAmount),
        destinationAddress,
        orderType,
        depositAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        status: "awaiting_deposit",
        created: new Date().toISOString()
      }, 2000);

      toast({
        title: "Transaction created",
        description: "Your bridge transaction has been set up successfully",
      });

      return response;
    } catch (error) {
      console.error("Failed to create transaction", error);
      toast({
        title: "Transaction failed",
        description: "Failed to create bridge transaction. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [fromCurrency, toCurrency, amount, estimatedReceiveAmount, destinationAddress, orderType]);

  const value = {
    fromCurrency,
    toCurrency,
    amount,
    estimatedReceiveAmount,
    destinationAddress,
    orderType,
    timeRemaining,
    isCalculating,
    availableCurrencies,
    isLoadingCurrencies,
    setFromCurrency,
    setToCurrency,
    setAmount,
    setDestinationAddress,
    setOrderType,
    createBridgeTransaction
  };

  return (
    <BridgeContext.Provider value={value}>
      {children}
    </BridgeContext.Provider>
  );
}

export const useBridge = () => {
  const context = useContext(BridgeContext);
  if (context === undefined) {
    throw new Error("useBridge must be used within a BridgeProvider");
  }
  return context;
};
