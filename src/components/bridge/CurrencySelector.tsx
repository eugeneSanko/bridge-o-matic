import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AddressPlaceholder } from "@/components/bridge/AddressPlaceholder";
import { Clock } from "lucide-react";
import { Currency } from "@/types/bridge";
import { useEffect } from "react";
import { Icon } from "@iconify/react";

interface CurrencySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAmountChange?: (value: string) => void;
  amount?: string;
  estimatedAmount?: string;
  isCalculating?: boolean;
  timeRemaining?: string | null;
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
  isReceiveSide?: boolean;
}

export const CurrencySelector = ({
  label,
  value,
  onChange,
  onAmountChange,
  amount,
  estimatedAmount,
  isCalculating,
  timeRemaining,
  availableCurrencies,
  isLoadingCurrencies,
  isReceiveSide = false,
}: CurrencySelectorProps) => {
  const handleAmountChange = (value: string) => {
    if (!onAmountChange) return;

    const regex = /^\d*\.?\d*$/;
    if (value === "" || regex.test(value)) {
      onAmountChange(value);
    }
  };

  // Filter currencies based on whether they're for send or receive
  const filteredCurrencies = availableCurrencies.filter((currency) =>
    isReceiveSide ? currency.recv === 1 : currency.send === 1
  );

  useEffect(() => {
    // If currencies are loaded and we don't have a value selected yet, set the first one
    if (filteredCurrencies.length > 0 && !value) {
      // Find currencies by priority or defaults
      if (!isReceiveSide) {
        // For send side, prefer BTC, ETH or high priority currencies
        const btc = filteredCurrencies.find((c) => c.code === "BTC");
        const eth = filteredCurrencies.find((c) => c.code === "ETH");
        const highPriorityCurrency = filteredCurrencies.sort(
          (a, b) => (b.priority || 0) - (a.priority || 0)
        )[0];

        onChange(
          btc?.code ||
            eth?.code ||
            highPriorityCurrency?.code ||
            filteredCurrencies[0].code ||
            ""
        );
      } else {
        // For receive side, prefer stablecoins or ETH if no currency is selected
        const usdt = filteredCurrencies.find((c) => c.code?.includes("USDT"));
        const usdc = filteredCurrencies.find((c) => c.code?.includes("USDC"));
        const eth = filteredCurrencies.find((c) => c.code === "ETH");
        const highPriorityCurrency = filteredCurrencies.sort(
          (a, b) => (b.priority || 0) - (a.priority || 0)
        )[0];

        onChange(
          usdt?.code ||
            usdc?.code ||
            eth?.code ||
            highPriorityCurrency?.code ||
            filteredCurrencies[0].code ||
            ""
        );
      }
    }
  }, [filteredCurrencies, value, onChange, isReceiveSide]);

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium mb-2 text-gray-300 text-center sm:text-left">
        {label}
      </label>
      <div className="relative">
        <Select
          value={value}
          onValueChange={onChange}
          disabled={isLoadingCurrencies}
        >
          <SelectTrigger className="h-[3.5rem] sm:h-[4.5rem] px-3 sm:px-4 bg-secondary/30 text-sm sm:text-base">
            <div className="flex flex-col w-full">
              <div className="pointer-events-none flex items-center w-full h-10">
                <SelectValue
                  placeholder={
                    isLoadingCurrencies ? (
                      <Icon icon="eos-icons:three-dots-loading" width={50} />
                    ) : (
                      "Select currency"
                    )
                  }
                  className="[&>span]:w-auto [&>span]:!flex-none"
                />
              </div>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="pointer-events-none text-xs text-gray-400 text-left">
                  {isReceiveSide ? "You'll receive:" : "You'll send:"}
                </span>
                {isReceiveSide ? (
                  <span className="pointer-events-none text-sm flex items-center gap-1">
                    {isCalculating ? (
                      <span className="text-gray-400">Calculating...</span>
                    ) : estimatedAmount ? (
                      <>
                        <span>{estimatedAmount}</span>
                        {timeRemaining && (
                          <span className="flex items-center text-xs text-[#0FA0CE]">
                            <Clock className="h-3 w-3 mr-1" />
                            {timeRemaining}s
                          </span>
                        )}
                      </>
                    ) : (
                      "0.00"
                    )}
                  </span>
                ) : (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="relative z-10"
                  >
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={amount || ""}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-24 h-6 px-1 text-right bg-transparent border-none text-sm focus:outline-none focus:ring-0"
                    />
                  </div>
                )}
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className=" border border-white/10 max-h-[300px] glass-card">
            {isLoadingCurrencies ? (
              <SelectItem value="loading" disabled>
                <Icon icon="eos-icons:three-dots-loading" />
              </SelectItem>
            ) : filteredCurrencies.length === 0 ? (
              <SelectItem value="none" disabled>
                No currencies available
              </SelectItem>
            ) : (
              filteredCurrencies
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .map((currency) => (
                  <SelectItem key={currency.code} value={currency.code || ""}>
                    <div className="flex items-center gap-2">
                      {currency.logo ? (
                        <img
                          src={currency.logo}
                          alt={currency.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: currency.color || "#888" }}
                        >
                          {currency.coin?.substring(0, 1).toUpperCase() ||
                            currency.code?.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span>
                        {currency.name}
                        {currency.network &&
                          currency.network !== currency.coin && (
                            <span className="text-xs  ml-1 text-muted-foreground">
                              [{currency.network}]
                            </span>
                          )}
                      </span>
                    </div>
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
