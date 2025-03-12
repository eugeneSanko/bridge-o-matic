import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBridge } from "@/contexts/BridgeContext";
import { CurrencyExchangeSection } from "./CurrencyExchangeSection";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { BridgeFormActions } from "./BridgeFormActions";
import { useRateRefresh } from "@/hooks/useRateRefresh";
import { DebugPanel } from "./DebugPanel";

export const BridgeForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    formatNumberWithCommas,
  } = useBridge();

  const [formValuesForErrorClearing, setFormValuesForErrorClearing] = useState({
    fromCurrency,
    toCurrency,
    amount,
    destinationAddress,
    orderType,
  });

  useEffect(() => {
    setFormValuesForErrorClearing({
      fromCurrency,
      toCurrency,
      amount,
      destinationAddress,
      orderType,
    });

    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [
    fromCurrency,
    toCurrency,
    amount,
    destinationAddress,
    orderType,
    errorMessage,
  ]);

  const [fromExchangeRate, setFromExchangeRate] = useState<{
    rate: string;
    usdValue: string;
  } | null>(null);
  const [toExchangeRate, setToExchangeRate] = useState<{
    rate: string;
    usdValue: string;
  } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const { manualRefreshEnabled, handleRefreshRate } = useRateRefresh(
    calculateReceiveAmount
  );

  const lastCalculationTimeRef = useRef<number>(0);
  const lastInputValuesRef = useRef({
    fromCurrency,
    toCurrency,
    amount,
    orderType,
  });
  const isAmountChangeRef = useRef(false);
  const isCurrencyChangeRef = useRef(false);
  const isOrderTypeChangeRef = useRef(false);

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

  useEffect(() => {
    if (addressError && destinationAddress) {
      setAddressError(null);
    }
  }, [destinationAddress, addressError]);

  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
    isAmountChangeRef.current = true;
  };

  const handleFromCurrencyChange = (currency: string) => {
    setFromCurrency(currency);
    isCurrencyChangeRef.current = true;
  };

  const handleToCurrencyChange = (currency: string) => {
    setToCurrency(currency);
    isCurrencyChangeRef.current = true;
    setAddressError(null);
    setErrorMessage(null);
  };

  const handleOrderTypeChange = (type: "fixed" | "float") => {
    setOrderType(type);
    isOrderTypeChangeRef.current = true;
    lastCalculationTimeRef.current = 0;
  };

  const handleDestinationAddressChange = (address: string) => {
    setDestinationAddress(address);
    if (addressError) {
      setAddressError(null);
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  useEffect(() => {
    const inputsChanged =
      fromCurrency !== lastInputValuesRef.current.fromCurrency ||
      toCurrency !== lastInputValuesRef.current.toCurrency ||
      amount !== lastInputValuesRef.current.amount ||
      orderType !== lastInputValuesRef.current.orderType;

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

      lastInputValuesRef.current = {
        fromCurrency,
        toCurrency,
        amount,
        orderType,
      };

      if (
        isAmountChangeRef.current ||
        isCurrencyChangeRef.current ||
        isOrderTypeChangeRef.current ||
        lastCalculationTimeRef.current === 0 ||
        timeSinceLastCalculation >= 120000
      ) {
        calculateReceiveAmount();
        isAmountChangeRef.current = false;
        isCurrencyChangeRef.current = false;
        isOrderTypeChangeRef.current = false;
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

    setAddressError(null);
    setErrorMessage(null);
    setDebugInfo(null);

    if (fromCurrency && toCurrency && amount && parseFloat(amount) > 0) {
      await calculateReceiveAmount();
    }

    setIsSubmitting(true);

    try {
      toast({
        title: "Creating Order",
        description: "Initializing your bridge transaction...",
      });

      const result = await createBridgeTransaction();

      if (result && result.debugInfo) {
        setDebugInfo(result.debugInfo);
      }

      if (result && result.code !== undefined && result.code !== 0) {
        if (
          result.code === 301 ||
          (result.msg && result.msg.includes("Invalid address"))
        ) {
          setAddressError(
            "Invalid address for selected cryptocurrency network"
          );
          toast({
            title: "Invalid Address",
            description:
              "The destination address is not valid for the selected cryptocurrency network.",
            variant: "destructive",
          });
        } else if (result.code === 500 && result.msg === "Order not found") {
          setErrorMessage("Order not found. Please try again.");
          toast({
            title: "Order Error",
            description:
              "Order not found. Please try again with different parameters.",
            variant: "destructive",
          });
        } else if (result.msg) {
          setErrorMessage(result.msg);
          toast({
            title: "Transaction Failed",
            description: result.msg,
            variant: "destructive",
          });
        }
      } else if (result && result.code === 0) {
        toast({
          title: "Order Created",
          description: "Your bridge transaction has been successfully created!",
        });

        const orderId = result.data?.id || result.orderId;
        const orderToken = result.data?.token || result.orderToken;
        
        let redirectUrl = `/bridge/awaiting-deposit?orderId=${orderId}`;
        if (orderToken) {
          redirectUrl += `&token=${orderToken}`;
        }
        
        navigate(redirectUrl);
      } else {
        toast({
          title: "Transaction Failed",
          description: "Unable to create bridge transaction. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bridge transaction failed:", error);

      if (error && typeof error === "object") {
        if (error.message && error.message.includes("Invalid address")) {
          setAddressError(
            "Invalid address for selected cryptocurrency network"
          );
          toast({
            title: "Invalid Address",
            description:
              "The destination address is not valid for the selected cryptocurrency network.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Transaction Failed",
            description:
              error instanceof Error
                ? error.message
                : "An error occurred creating the transaction",
            variant: "destructive",
          });
        }

        if ("debugInfo" in error) {
          setDebugInfo(error.debugInfo);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapCurrencies = () => {
    const canSendToCurrency = availableCurrencies.some(
      (c) => c.code === toCurrency && c.send === 1
    );
    const canReceiveFromCurrency = availableCurrencies.some(
      (c) => c.code === fromCurrency && c.recv === 1
    );

    if (canSendToCurrency && canReceiveFromCurrency) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      isCurrencyChangeRef.current = true;
      lastCalculationTimeRef.current = 0;

      setAddressError(null);
      setErrorMessage(null);
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
      !amountError &&
      !addressError &&
      !errorMessage
  );

  const selectedToCurrency = availableCurrencies.find(
    (c) => c.code === toCurrency
  );

  return (
    <div className="glass-card p-4 sm:p-8 rounded-lg mb-10 sm:mb-14">
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
        formatNumberWithCommas={formatNumberWithCommas}
        orderType={orderType}
      />

      <div className="space-y-4 sm:space-y-6">
        <DestinationAddressInput
          value={destinationAddress}
          onChange={handleDestinationAddressChange}
          borderColor={selectedToCurrency?.color}
          receivingCurrency={toCurrency}
          currencyNetwork={selectedToCurrency?.network}
          errorMessage={addressError}
        />

        <OrderTypeSelector value={orderType} onChange={handleOrderTypeChange} />

        <BridgeFormActions
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          onBridgeAssets={handleBridgeAssets}
          errorMessage={errorMessage}
          formValues={formValuesForErrorClearing}
        />

        <DebugPanel debugInfo={debugInfo} isLoading={isSubmitting} />
      </div>
    </div>
  );
};
