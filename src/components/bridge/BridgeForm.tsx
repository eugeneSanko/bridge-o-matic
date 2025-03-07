
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "./CurrencySelector";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { useBridge } from "@/contexts/BridgeContext";
import { useNavigate } from "react-router-dom";

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
    createBridgeTransaction,
    availableCurrencies,
    isLoadingCurrencies
  } = useBridge();

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

  const isFormValid = Boolean(
    fromCurrency &&
    toCurrency &&
    amount &&
    parseFloat(amount) > 0 &&
    destinationAddress
  );

  return (
    <div className="glass-card p-4 sm:p-8 rounded-lg mb-8 sm:mb-12">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <CurrencySelector
          label="Send"
          value={fromCurrency}
          onChange={setFromCurrency}
          onAmountChange={setAmount}
          amount={amount}
          availableCurrencies={availableCurrencies}
          isLoadingCurrencies={isLoadingCurrencies}
        />
        
        <ArrowRight className="hidden sm:block w-6 h-6 mt-6 text-[#0FA0CE]" />
        <ArrowRight className="block sm:hidden w-6 h-6 rotate-90 mx-auto text-[#0FA0CE]" />
        
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
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <DestinationAddressInput
          value={destinationAddress}
          onChange={setDestinationAddress}
        />

        <OrderTypeSelector
          value={orderType}
          onChange={setOrderType}
        />

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
