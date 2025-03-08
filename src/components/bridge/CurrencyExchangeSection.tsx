
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, AlertCircle } from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Currency } from "@/types/bridge";

interface CurrencyExchangeSectionProps {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  estimatedReceiveAmount: string;
  isCalculating: boolean;
  timeRemaining: string | null;
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
  fromExchangeRate: {
    rate: string;
    usdValue: string;
  } | null;
  toExchangeRate: {
    rate: string;
    usdValue: string;
  } | null;
  lastPriceData: any;
  amountError: string | null;
  onFromCurrencyChange: (currency: string) => void;
  onToCurrencyChange: (currency: string) => void;
  onAmountChange: (amount: string) => void;
  onSwapCurrencies: () => void;
}

export const CurrencyExchangeSection = ({
  fromCurrency,
  toCurrency,
  amount,
  estimatedReceiveAmount,
  isCalculating,
  timeRemaining,
  availableCurrencies,
  isLoadingCurrencies,
  fromExchangeRate,
  toExchangeRate,
  lastPriceData,
  amountError,
  onFromCurrencyChange,
  onToCurrencyChange,
  onAmountChange,
  onSwapCurrencies,
}: CurrencyExchangeSectionProps) => {
  const fromCurrencyObj =
    availableCurrencies.find((c) => c.code === fromCurrency) || null;
  const toCurrencyObj =
    availableCurrencies.find((c) => c.code === toCurrency) || null;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 relative">
        <CurrencySelector
          label="Send"
          value={fromCurrency}
          onChange={onFromCurrencyChange}
          onAmountChange={onAmountChange}
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
            onClick={onSwapCurrencies}
          >
            <ArrowLeftRight className="h-4 w-4 text-[#0FA0CE]" />
          </Button>
        </div>

        <CurrencySelector
          label="Receive"
          value={toCurrency}
          onChange={onToCurrencyChange}
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
    </>
  );
};
