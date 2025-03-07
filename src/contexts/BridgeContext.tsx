import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { toast } from "@/hooks/use-toast";
import { useBridgeService } from "@/hooks/useBridgeService";
import { BridgeContextType, TimerConfig, Currency } from "@/types/bridge";

/**
 * Configuration for timers used in the bridge process
 */
const TIMER_CONFIG: TimerConfig = {
  QUOTE_VALIDITY_MS: 10000, // 10 seconds
  TIMER_UPDATE_INTERVAL_MS: 50, // 50ms update interval for smooth countdown
};

const BridgeContext = createContext<BridgeContextType | undefined>(undefined);

/**
 * BridgeProvider component that manages the state and logic for the cross-chain bridge functionality
 *
 * @param children - React children components
 */
export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] =
    useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [orderType, setOrderType] = useState<"fixed" | "float">("fixed");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    []
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Use refs for timers to prevent issues with cleanup and closures
  const priceCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quoteExpiryTimeRef = useRef<number | null>(null);

  const {
    fetchCurrencies,
    calculatePrice,
    createOrder,
    checkOrderStatus,
    lastPriceCheck,
  } = useBridgeService();

  /**
   * Function to refresh available currencies
   */
  const refreshCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    try {
      const currencies = await fetchCurrencies();
      if (Array.isArray(currencies) && currencies.length > 0) {
        setAvailableCurrencies(currencies);
        console.log(`Loaded ${currencies.length} currencies`);
      } else {
        console.warn("No currencies received from API");
        setAvailableCurrencies([]);
      }
    } catch (error) {
      console.error("Failed to load currencies:", error);
      toast({
        title: "Error",
        description: "Failed to load available currencies",
        variant: "destructive",
      });
      setAvailableCurrencies([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [fetchCurrencies]);

  /**
   * Load available currencies on component mount
   */
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      try {
        const currencies = await fetchCurrencies();
        if (Array.isArray(currencies) && currencies.length > 0) {
          setAvailableCurrencies(currencies);
          console.log(`Loaded ${currencies.length} currencies`);
        } else {
          console.warn("No currencies received from API");
          setAvailableCurrencies([]);
        }
      } catch (error) {
        console.error("Failed to load currencies:", error);
        toast({
          title: "Error",
          description: "Failed to load available currencies",
          variant: "destructive",
        });
        setAvailableCurrencies([]);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    loadCurrencies();
  }, [fetchCurrencies]);

  /**
   * Start the countdown timer when a new price estimate is received
   */
  useEffect(() => {
    // Clear any existing timer
    if (timeRemainingTimerRef.current) {
      clearInterval(timeRemainingTimerRef.current);
      timeRemainingTimerRef.current = null;
    }

    // Only start the timer if we have a valid estimate and aren't calculating
    if (estimatedReceiveAmount && !isCalculating) {
      // Set the expiry time for this quote
      quoteExpiryTimeRef.current = Date.now() + TIMER_CONFIG.QUOTE_VALIDITY_MS;

      // Update function to calculate and display remaining time
      const updateTimer = () => {
        if (!quoteExpiryTimeRef.current) return;

        const now = Date.now();
        const timeLeft = Math.max(0, quoteExpiryTimeRef.current - now);

        if (timeLeft <= 0) {
          setTimeRemaining(null);
          if (timeRemainingTimerRef.current) {
            clearInterval(timeRemainingTimerRef.current);
            timeRemainingTimerRef.current = null;
          }
          return;
        }

        // Format the remaining time as seconds with 2 decimal places
        const seconds = Math.floor(timeLeft / 1000);
        const milliseconds = Math.floor((timeLeft % 1000) / 10);
        setTimeRemaining(
          `${seconds}.${milliseconds.toString().padStart(2, "0")}`
        );
      };

      // Initial update
      updateTimer();

      // Set interval for continuous updates
      timeRemainingTimerRef.current = setInterval(
        updateTimer,
        TIMER_CONFIG.TIMER_UPDATE_INTERVAL_MS
      );
    } else {
      // Reset timer if we're recalculating or have no estimate
      setTimeRemaining(null);
    }

    // Clean up timer on unmount or when dependencies change
    return () => {
      if (timeRemainingTimerRef.current) {
        clearInterval(timeRemainingTimerRef.current);
        timeRemainingTimerRef.current = null;
      }
    };
  }, [estimatedReceiveAmount, isCalculating]);

  /**
   * Calculate the estimated receive amount based on current input values
   */
  const calculateReceiveAmount = useCallback(async () => {
    // Clear any existing price check timer
    if (priceCheckTimerRef.current) {
      clearTimeout(priceCheckTimerRef.current);
      priceCheckTimerRef.current = null;
    }

    // Validate required inputs
    if (!fromCurrency || !toCurrency || !amount || parseFloat(amount) <= 0) {
      setEstimatedReceiveAmount("");
      return;
    }

    setIsCalculating(true);
    try {
      const now = new Date().getTime();

      // Use cached price check if it's still valid
      if (
        lastPriceCheck &&
        lastPriceCheck.data.from.currency === fromCurrency &&
        lastPriceCheck.data.to.currency === toCurrency &&
        lastPriceCheck.expiresAt > now
      ) {
        const receiveAmount = lastPriceCheck.data.to.amount;
        setEstimatedReceiveAmount(receiveAmount);

        // Reset quote expiry time when using a cached quote
        quoteExpiryTimeRef.current =
          Date.now() + TIMER_CONFIG.QUOTE_VALIDITY_MS;
      } else {
        // Get fresh price data
        const data = await calculatePrice(
          fromCurrency,
          toCurrency,
          amount,
          orderType
        );

        if (!data) {
          setEstimatedReceiveAmount("0");
          setIsCalculating(false);
          return;
        }

        setEstimatedReceiveAmount(data.data.to.amount);

        // Calculate when to refresh the price
        const timeToExpiry = data.expiresAt - now;
        const refreshTime = Math.max(timeToExpiry - 5000, 0);

        // Schedule a refresh before the price expires
        priceCheckTimerRef.current = setTimeout(() => {
          calculateReceiveAmount();
        }, refreshTime);
      }
    } catch (error) {
      console.error("Error calculating amount:", error);
      setEstimatedReceiveAmount("0");
      toast({
        title: "Calculation Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to calculate estimated amount",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [
    amount,
    fromCurrency,
    toCurrency,
    orderType,
    lastPriceCheck,
    calculatePrice,
  ]);

  /**
   * Start periodic status checking for an order
   *
   * @param orderId - The ID of the order to monitor
   * @returns Cleanup function
   */
  const startStatusChecking = useCallback(
    (orderId: string) => {
      // Clear any existing status check timer
      if (statusCheckTimerRef.current) {
        clearInterval(statusCheckTimerRef.current);
        statusCheckTimerRef.current = null;
      }

      // Set up status check at regular intervals
      const timerId = setInterval(async () => {
        const data = await checkOrderStatus(orderId);

        // Stop checking if order is in a terminal state
        if (
          data &&
          ["completed", "failed", "expired", "refunded"].includes(
            data.status
          )
        ) {
          if (statusCheckTimerRef.current) {
            clearInterval(statusCheckTimerRef.current);
            statusCheckTimerRef.current = null;
          }
        }
      }, 10000);

      statusCheckTimerRef.current = timerId;

      // Return cleanup function
      return () => {
        if (statusCheckTimerRef.current) {
          clearInterval(statusCheckTimerRef.current);
          statusCheckTimerRef.current = null;
        }
      };
    },
    [checkOrderStatus]
  );

  /**
   * Update estimated receive amount when inputs change
   */
  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      calculateReceiveAmount();
    } else {
      setEstimatedReceiveAmount("");
    }

    // Cleanup all timers when component unmounts or when key dependencies change
    return () => {
      if (priceCheckTimerRef.current) {
        clearTimeout(priceCheckTimerRef.current);
        priceCheckTimerRef.current = null;
      }
      if (statusCheckTimerRef.current) {
        clearInterval(statusCheckTimerRef.current);
        statusCheckTimerRef.current = null;
      }
      if (timeRemainingTimerRef.current) {
        clearInterval(timeRemainingTimerRef.current);
        timeRemainingTimerRef.current = null;
      }
    };
  }, [amount, fromCurrency, toCurrency, orderType, calculateReceiveAmount]);

  /**
   * Validates all inputs required for a bridge transaction
   *
   * @throws Error with description if validation fails
   */
  const validateBridgeTransaction = () => {
    if (!fromCurrency) throw new Error("Source currency is required");
    if (!toCurrency) throw new Error("Destination currency is required");
    if (!amount || parseFloat(amount) <= 0)
      throw new Error("Valid amount is required");
    if (!destinationAddress) throw new Error("Destination address is required");

    if (lastPriceCheck) {
      const minAmount = parseFloat(lastPriceCheck.data.from.min);
      const maxAmount = parseFloat(lastPriceCheck.data.from.max);
      const currentAmount = parseFloat(amount);

      if (currentAmount < minAmount) {
        throw new Error(`Minimum amount is ${minAmount} ${fromCurrency}`);
      }

      if (currentAmount > maxAmount) {
        throw new Error(`Maximum amount is ${maxAmount} ${fromCurrency}`);
      }
    }
  };

  /**
   * Creates a bridge transaction with the current input values
   *
   * @returns Object containing orderId if successful, null otherwise
   */
  const createBridgeTransaction = async () => {
    try {
      validateBridgeTransaction();

      // Verify exchange rate is still valid
      const now = new Date().getTime();
      if (!lastPriceCheck || lastPriceCheck.expiresAt < now) {
        await calculateReceiveAmount();
        throw new Error("Exchange rate has expired. Please try again.");
      }

      // Create order
      const result = await createOrder(
        fromCurrency,
        toCurrency,
        amount,
        destinationAddress,
        orderType,
        lastPriceCheck.data.rate
      );

      if (result) {
        startStatusChecking(result.orderId);

        toast({
          title: "Transaction Created",
          description: "Your bridge transaction has been initiated",
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to create bridge transaction",
        variant: "destructive",
      });
      console.error("Bridge transaction error:", error);
      return null;
    }
  };

  // Context value to be provided
  const value = {
    fromCurrency,
    toCurrency,
    amount,
    estimatedReceiveAmount,
    destinationAddress,
    orderType,
    isCalculating,
    timeRemaining,
    setFromCurrency,
    setToCurrency,
    setAmount,
    setDestinationAddress,
    setOrderType,
    calculateReceiveAmount,
    createBridgeTransaction,
    availableCurrencies,
    isLoadingCurrencies,
    refreshCurrencies,
  };

  return (
    <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>
  );
}

/**
 * Hook to access the bridge context
 *
 * @returns Bridge context
 * @throws Error if used outside of BridgeProvider
 */
export function useBridge() {
  const context = useContext(BridgeContext);
  if (context === undefined) {
    throw new Error("useBridge must be used within a BridgeProvider");
  }
  return context;
}
