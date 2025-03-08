
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBridge } from "@/contexts/BridgeContext";
import { CurrencyExchangeSection } from "./CurrencyExchangeSection";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { BridgeFormActions } from "./BridgeFormActions";
import { useRateRefresh } from "@/hooks/useRateRefresh";

export const BridgeForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
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
    lastPriceData,
    amountError,
  } = useBridge();

  const [fromExchangeRate, setFromExchangeRate] = useState<{
    rate: string;
    usdValue: string;
  } | null>(null);
  const [toExchangeRate, setToExchangeRate] = useState<{
    rate: string;
    usdValue: string;
  } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Custom hook for rate refresh
  const { manualRefreshEnabled, handleRefreshRate } = useRateRefresh(calculateReceiveAmount);

  // Ref to track if we should recalculate the price
  const lastCalculationTimeRef = useRef<number>(0);
  // Ref to track the latest input values for debouncing
  const lastInputValuesRef = useRef({
    fromCurrency,
    toCurrency,
    amount,
    orderType,
  });
  // Track if we are handling an amount change specifically
  const isAmountChangeRef = useRef(false);
  // Track if this is a currency change operation
  const isCurrencyChangeRef = useRef(false);

  // Update exchange rates when price data changes
  useEffect(() => {
    if (lastPriceData && lastPriceData.data) {
      const { from, to } = lastPriceData.data;

      if (from && to) {
        const fromRate = parseFloat(from.rate?.toString() || "0").toFixed(8);
        const fromUsdValue = from.usd
          ? parseFloat(from.usd.toString()).toFixed(2)
          : "0.00";
        setFromExchangeRate({ rate: fromRate, usdValue: fromUsdValue });

        const toRate = parseFloat(to.rate?.toString() || "0").toFixed(8);
        const toUsdValue = to.usd
          ? parseFloat(to.usd.toString()).toFixed(2)
          : "0.00";
        setToExchangeRate({ rate: toRate, usdValue: toUsdValue });

        setLastUpdateTime(new Date());
        lastCalculationTimeRef.current = Date.now();
      }
    } else {
      setFromExchangeRate(null);
      setToExchangeRate(null);
    }
  }, [lastPriceData]);

  // Handle amount changes specifically - always recalculate for amount changes
  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
    isAmountChangeRef.current = true;
  };

  // Handle from currency changes - trigger recalculation
  const handleFromCurrencyChange = (currency: string) => {
    setFromCurrency(currency);
    isCurrencyChangeRef.current = true;
  };

  // Handle to currency changes - trigger recalculation
  const handleToCurrencyChange = (currency: string) => {
    setToCurrency(currency);
    isCurrencyChangeRef.current = true;
  };

  // Recalculate price when input values change
  useEffect(() => {
    // Check if any input values have changed
    const inputsChanged =
      fromCurrency !== lastInputValuesRef.current.fromCurrency ||
      toCurrency !== lastInputValuesRef.current.toCurrency ||
      amount !== lastInputValuesRef.current.amount ||
      orderType !== lastInputValuesRef.current.orderType;

    // Only calculate if inputs changed and there's an amount
    if (
      inputsChanged &&
      fromCurrency &&
      toCurrency &&
      amount &&
      parseFloat(amount) > 0 &&
      !isCalculating
    ) {
      const currentTime = Date.now();
      const timeSinceLastCalculation =
        currentTime - lastCalculationTimeRef.current;

      // Update the latest input values
      lastInputValuesRef.current = {
        fromCurrency,
        toCurrency,
        amount,
        orderType,
      };

      // If this is an amount change, or a currency change, or a calculation has never been done,
      // or it's been more than 2 minutes, do the calculation
      if (
        isAmountChangeRef.current ||
        isCurrencyChangeRef.current ||
        lastCalculationTimeRef.current === 0 ||
        timeSinceLastCalculation >= 120000
      ) {
        calculateReceiveAmount();
        isAmountChangeRef.current = false; // Reset the flag
        isCurrencyChangeRef.current = false; // Reset the flag
      }
    }
  }, [
    fromCurrency,
    toCurrency,
    amount,
    orderType,
    calculateReceiveAmount,
    isCalculating,
  ]);

  const handleBridgeAssets = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    // Always calculate latest rate before submitting
    if (fromCurrency && toCurrency && amount && parseFloat(amount) > 0) {
      await calculateReceiveAmount();
    }

    setIsSubmitting(true);
    try {
      const result = await createBridgeTransaction();
      if (result) {
        navigate(`/bridge/awaiting-deposit?orderId=${result.orderId}`);
      }
    } catch (error) {
      console.error("Bridge transaction failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapCurrencies = () => {
    // Check if the currencies can be swapped (to currency can be sent, from currency can be received)
    const canSendToCurrency = availableCurrencies.some(
      (c) => c.code === toCurrency && c.send === 1
    );
    const canReceiveFromCurrency = availableCurrencies.some(
      (c) => c.code === fromCurrency && c.recv === 1
    );

    if (canSendToCurrency && canReceiveFromCurrency) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setAmount(""); // Reset amount when swapping

      // Force a recalculation on next render after swap
      lastCalculationTimeRef.current = 0;
    } else {
      toast({
        title: "Cannot swap currencies",
        description: "One or both currencies don't support this direction",
        duration: 3000,
      });
    }
  };

  const isFormValid = Boolean(
    fromCurrency &&
      toCurrency &&
      amount &&
      parseFloat(amount) > 0 &&
      destinationAddress &&
      !amountError
  );

  return (
    <div className="glass-card p-4 sm:p-8 rounded-lg mb-8 sm:mb-12">
      <CurrencyExchangeSection
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        amount={amount}
        estimatedReceiveAmount={estimatedReceiveAmount}
        isCalculating={isCalculating}
        timeRemaining={timeRemaining}
        availableCurrencies={availableCurrencies}
        isLoadingCurrencies={isLoadingCurrencies}
        fromExchangeRate={fromExchangeRate}
        toExchangeRate={toExchangeRate}
        lastPriceData={lastPriceData}
        amountError={amountError}
        onFromCurrencyChange={handleFromCurrencyChange}
        onToCurrencyChange={handleToCurrencyChange}
        onAmountChange={handleAmountChange}
        onSwapCurrencies={handleSwapCurrencies}
      />

      <div className="space-y-4 sm:space-y-6">
        <DestinationAddressInput
          value={destinationAddress}
          onChange={setDestinationAddress}
          borderColor={availableCurrencies.find((c) => c.code === toCurrency)?.color}
          receivingCurrency={toCurrency}
        />

        <OrderTypeSelector value={orderType} onChange={setOrderType} />

        <BridgeFormActions
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          onBridgeAssets={handleBridgeAssets}
        />
      </div>
    </div>
  );
};
