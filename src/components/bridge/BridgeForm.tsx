import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeftRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "./CurrencySelector";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { useBridge } from "@/contexts/BridgeContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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
  const [manualRefreshEnabled, setManualRefreshEnabled] =
    useState<boolean>(true);

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

  const handleRefreshRate = () => {
    if (manualRefreshEnabled) {
      calculateReceiveAmount();
      setManualRefreshEnabled(false);
      toast({
        title: "Rates refreshed",
        description: "Next manual refresh available in 2 minutes",
        duration: 3000,
      });
      setTimeout(() => setManualRefreshEnabled(true), 120000); // 2 minutes
    } else {
      toast({
        title: "Please wait",
        description: "Manual rate refresh is available every 2 minutes",
        duration: 3000,
      });
    }
  };

  const fromCurrencyObj =
    availableCurrencies.find((c) => c.code === fromCurrency) || null;
  const toCurrencyObj =
    availableCurrencies.find((c) => c.code === toCurrency) || null;

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6  relative">
        <CurrencySelector
          label="Send"
          value={fromCurrency}
          onChange={handleFromCurrencyChange}
          onAmountChange={handleAmountChange}
          amount={amount}
          availableCurrencies={availableCurrencies}
          isLoadingCurrencies={isLoadingCurrencies}
          borderColor={fromCurrencyObj?.color}
          exchangeRate={fromExchangeRate}
          minMaxAmounts={
            lastPriceData?.data.from
              ? {
                  min: lastPriceData.data.from.min,
                  max: lastPriceData.data.from.max,
                }
              : undefined
          }
        />

        <div className="flex flex-col items-center justify-center h-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-secondary my-1 -mt-4"
            onClick={handleSwapCurrencies}
          >
            <ArrowLeftRight className="h-4 w-4 text-[#0FA0CE]" />
          </Button>
        </div>

        <CurrencySelector
          label="Receive"
          value={toCurrency}
          onChange={handleToCurrencyChange}
          estimatedAmount={estimatedReceiveAmount}
          isCalculating={isCalculating}
          timeRemaining={timeRemaining}
          availableCurrencies={availableCurrencies}
          isLoadingCurrencies={isLoadingCurrencies}
          isReceiveSide={true}
          borderColor={toCurrencyObj?.color}
          exchangeRate={toExchangeRate}
        />
      </div>

      {amountError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{amountError}</AlertDescription>
        </Alert>
      )}

      {/* {lastUpdateTime && (
        <div className="text-xs text-center text-gray-400 mb-4">
          Rates last updated: {lastUpdateTime.toLocaleTimeString()}
          <Button
            variant="link"
            className="text-xs text-[#0FA0CE] ml-2 p-0 h-auto"
            onClick={handleRefreshRate}
            disabled={!manualRefreshEnabled}
          >
            {manualRefreshEnabled ? "Refresh manually" : "Wait 2m to refresh"}
          </Button>
        </div>
      )} */}

      <div className="space-y-4 sm:space-y-6">
        <DestinationAddressInput
          value={destinationAddress}
          onChange={setDestinationAddress}
          borderColor={toCurrencyObj?.color}
          receivingCurrency={toCurrency}
        />

        <OrderTypeSelector value={orderType} onChange={setOrderType} />

        <Button
          className="w-full h-[3.5rem] sm:h-[4.5rem] text-base sm:text-lg font-medium bg-[#0FA0CE] hover:bg-[#0FA0CE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleBridgeAssets}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Bridge Assets"}
        </Button>

        <p className="text-xs text-center text-gray-400">
          By proceeding, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};
