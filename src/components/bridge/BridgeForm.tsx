import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeftRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "./CurrencySelector";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { useBridge } from "@/contexts/BridgeContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const BridgeForm = () => {
  const navigate = useNavigate();
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
    amountError
  } = useBridge();
  
  const [fromExchangeRate, setFromExchangeRate] = useState<{rate: string; usdValue: string;} | null>(null);
  const [toExchangeRate, setToExchangeRate] = useState<{rate: string; usdValue: string;} | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [manualRefreshEnabled, setManualRefreshEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (lastPriceData && lastPriceData.data) {
      const { from, to } = lastPriceData.data;
      
      if (from && to) {
        const fromRate = parseFloat(from.rate?.toString() || "0").toFixed(8);
        const fromUsdValue = from.usd ? parseFloat(from.usd.toString()).toFixed(2) : "0.00";
        setFromExchangeRate({ rate: fromRate, usdValue: fromUsdValue });
        
        const toRate = parseFloat(to.rate?.toString() || "0").toFixed(8);
        const toUsdValue = to.usd ? parseFloat(to.usd.toString()).toFixed(2) : "0.00";
        setToExchangeRate({ rate: toRate, usdValue: toUsdValue });
        
        setLastUpdateTime(new Date());
      }
    } else {
      setFromExchangeRate(null);
      setToExchangeRate(null);
    }
  }, [lastPriceData]);
  
  useEffect(() => {
    if (fromCurrency && toCurrency && amount && parseFloat(amount) > 0 && !lastPriceData && !isCalculating) {
      calculateReceiveAmount();
    }
  }, [fromCurrency, toCurrency, amount, lastPriceData, isCalculating, calculateReceiveAmount]);

  const handleBridgeAssets = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

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
      setTimeout(() => setManualRefreshEnabled(true), 120000);
    }
  };

  const fromCurrencyObj =
    availableCurrencies.find((c) => c.code === fromCurrency) || null;
  const toCurrencyObj =
    availableCurrencies.find((c) => c.code === toCurrency) || null;

  const handleSwapCurrencies = () => {
    const newFromCurrency = availableCurrencies.find(
      (c) => c.code === toCurrency && c.send === 1
    );
    const newToCurrency = availableCurrencies.find(
      (c) => c.code === fromCurrency && c.recv === 1
    );

    if (newFromCurrency && newToCurrency) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setAmount("");
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 relative">
        <CurrencySelector
          label="Send"
          value={fromCurrency}
          onChange={setFromCurrency}
          onAmountChange={setAmount}
          amount={amount}
          availableCurrencies={availableCurrencies}
          isLoadingCurrencies={isLoadingCurrencies}
          borderColor={fromCurrencyObj?.color}
          exchangeRate={fromExchangeRate}
        />

        <div className="flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-secondary my-1 mt-8"
            onClick={handleSwapCurrencies}
          >
            <ArrowLeftRight className="h-4 w-4 text-[#0FA0CE]" />
          </Button>
        </div>

        <CurrencySelector
          label="Receive"
          value={toCurrency}
          onChange={setToCurrency}
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

      {lastUpdateTime && (
        <div className="text-xs text-center text-gray-400 mb-4">
          Rates last updated: {lastUpdateTime.toLocaleTimeString()} 
          <Button 
            variant="link" 
            className="text-xs text-[#0FA0CE] ml-2 p-0 h-auto" 
            onClick={handleRefreshRate}
            disabled={!manualRefreshEnabled}
          >
            {manualRefreshEnabled ? "Refresh" : "Wait 2m to refresh"}
          </Button>
        </div>
      )}

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
