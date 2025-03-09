
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, AlertCircle } from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Currency } from "@/types/bridge";
import { Skeleton } from "@/components/ui/skeleton";

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
  formatNumberWithCommas: (value: string | number) => string;
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
  formatNumberWithCommas,
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
          formatNumberWithCommas={formatNumberWithCommas}
        />

        <div className="flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-[#292e43] hover:bg-[#343b54] my-1"
            onClick={onSwapCurrencies}
          >
            <ArrowLeftRight className="h-6 w-6 text-[#0FA0CE]" />
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
          formatNumberWithCommas={formatNumberWithCommas}
        />
      </div>

      {amountError && (
        <Alert variant="destructive" className="mb-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{amountError}</AlertDescription>
        </Alert>
      )}
    </>
  );
};
