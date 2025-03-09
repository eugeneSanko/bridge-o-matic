
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressPlaceholder } from "@/components/bridge/AddressPlaceholder";
import { Clock, Search, ArrowDownUp, AlertCircle, ChevronDown } from "lucide-react";
import { Currency } from "@/types/bridge";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

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
  borderColor?: string;
  exchangeRate?: {
    rate: string;
    usdValue: string;
    invert?: boolean;
  } | null;
  minMaxAmounts?: {
    min: string;
    max: string;
  };
  formatNumberWithCommas?: (value: string | number) => string;
  orderType?: 'fixed' | 'float';
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
  borderColor,
  exchangeRate,
  minMaxAmounts,
  formatNumberWithCommas = (val) => val.toString(),
  orderType = 'fixed',
}: CurrencySelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  const [showMinMaxInfo, setShowMinMaxInfo] = useState(false);
  
  // Show min/max info while typing or when input is focused
  useEffect(() => {
    if (isTyping || isAmountFocused) {
      setShowMinMaxInfo(true);
    } else {
      const timer = setTimeout(() => {
        setShowMinMaxInfo(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTyping, isAmountFocused]);

  const handleAmountChange = (value: string) => {
    if (!onAmountChange) return;

    const regex = /^\d*\.?\d*$/;
    if (value === "" || regex.test(value)) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      setIsTyping(true);

      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1500);

      setTypingTimeout(timeout as unknown as number);

      onAmountChange(value);
    }
  };

  // Filter currencies based on send/receive capability
  const filteredCurrencies = availableCurrencies.filter((currency) =>
    isReceiveSide ? currency.recv === 1 : currency.send === 1
  );

  // Filter currencies based on search term
  const searchedCurrencies = filteredCurrencies.filter((currency) => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      currency.name?.toLowerCase().includes(search) ||
      currency.code?.toLowerCase().includes(search) ||
      currency.coin?.toLowerCase().includes(search) ||
      currency.network?.toLowerCase().includes(search)
    );
  });

  // Set default currency when currencies are loaded
  useEffect(() => {
    if (filteredCurrencies.length > 0 && !value) {
      if (!isReceiveSide) {
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

  const selectedCurrency = availableCurrencies.find((c) => c.code === value);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const formatDisplayValue = (value: string | number): string => {
    if (!formatNumberWithCommas) return value.toString();
    return formatNumberWithCommas(value);
  };

  const getCurrencyNetworkText = () => {
    if (!selectedCurrency) return "";
    
    if (selectedCurrency.network && 
        selectedCurrency.network !== selectedCurrency.coin && 
        selectedCurrency.network !== selectedCurrency.name) {
      return `(${selectedCurrency.network})`;
    }
    return "";
  };

  // Only show approximate symbol for float orders on receive side
  const shouldShowApproxSymbol = isReceiveSide && orderType === 'float';

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
        {selectedCurrency && (
          <span className="text-sm font-medium text-[#0FA0CE]">
            {selectedCurrency.name} {getCurrencyNetworkText()}
          </span>
        )}
      </div>
      
      <div className="relative">
        <div 
          className={`h-[4.5rem] px-4 bg-[#181c2c] border border-[#252a3a] rounded-xl text-lg transition-all duration-200 flex justify-between font-medium overflow-hidden ${!isReceiveSide ? 'cursor-text' : ''}`}
          style={{ borderColor: borderColor || "#252a3a", borderWidth: "1px" }}
        >
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex flex-col items-start min-w-0 flex-1 mr-2">
              {isReceiveSide ? (
                <div className="flex items-center w-full">
                  <span className="text-3xl font-semibold truncate">
                    {shouldShowApproxSymbol && (
                      <span className="text-gray-400 mr-1">≈</span>
                    )}
                    {isCalculating ? (
                      <span className="text-gray-400">Calculating...</span>
                    ) : estimatedAmount ? (
                      formatDisplayValue(estimatedAmount)
                    ) : (
                      "0"
                    )}
                  </span>
                </div>
              ) : (
                <div className="w-full relative flex items-center h-full">
                  <input
                    type="text"
                    placeholder="0"
                    value={amount || ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onFocus={() => setIsAmountFocused(true)}
                    onBlur={() => setIsAmountFocused(false)}
                    className="w-full h-full py-5 px-0 text-3xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                  />
                </div>
              )}
            </div>
            
            <Select
              value={value}
              onValueChange={onChange}
              disabled={isLoadingCurrencies}
              onOpenChange={setIsOpen}
            >
              <SelectTrigger 
                className="flex items-center gap-2 shrink-0 bg-transparent border-none cursor-pointer h-auto p-0 m-0 focus:outline-none focus:ring-0 w-auto"
              >
                <SelectValue placeholder="Select currency">
                  <div className="flex items-center gap-2">
                    {selectedCurrency?.logo ? (
                      <img
                        src={selectedCurrency.logo}
                        alt={selectedCurrency.name}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: selectedCurrency?.color || "#888" }}
                      >
                        {selectedCurrency?.coin?.substring(0, 1).toUpperCase() ||
                          selectedCurrency?.code?.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xl font-medium mr-1">
                      {selectedCurrency?.symbol || selectedCurrency?.code}
                    </span>
                    <ChevronDown className="h-5 w-5 opacity-70" />
                  </div>
                </SelectValue>
              </SelectTrigger>
              
              <SelectContent className="border border-white/10 max-h-[300px] glass-card bg-[#181c2c] z-50">
                <div className="sticky top-0 px-2 py-2 bg-[#181c2c] backdrop-blur-md z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search currency..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {exchangeRate && value && (
                  <div className="px-3 py-2 border-b border-white/10 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowDownUp className="h-3 w-3" />
                      <span>Exchange Rate</span>
                    </div>
                    <div className="font-mono">
                      {exchangeRate.invert
                        ? `1 ${selectedCurrency?.code} = ${formatDisplayValue(exchangeRate.rate)} ${
                            isReceiveSide ? "send" : "receive"
                          }`
                        : `1 ${isReceiveSide ? "send" : "receive"} = ${
                            formatDisplayValue(exchangeRate.rate)
                          } ${selectedCurrency?.code}`}
                    </div>
                  </div>
                )}

                {isLoadingCurrencies ? (
                  <SelectItem value="loading" disabled>
                    <Icon icon="eos-icons:three-dots-loading" />
                  </SelectItem>
                ) : searchedCurrencies.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {searchTerm
                      ? "No matching currencies"
                      : "No currencies available"}
                  </SelectItem>
                ) : (
                  searchedCurrencies
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
                                <span className="text-xs ml-1 text-muted-foreground">
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
      </div>

      <div className="h-8 mt-2">
        {exchangeRate && selectedCurrency && (
          <div className="text-xs text-gray-400 font-mono flex justify-between">
            <span>
              1 {selectedCurrency?.code} ≈ {formatDisplayValue(exchangeRate.rate || "0")} {isReceiveSide ? "send" : "receive"}
            </span>
            <span>${exchangeRate.usdValue || "0"}</span>
          </div>
        )}
        
        {!isReceiveSide && showMinMaxInfo && minMaxAmounts && (
          <div className="flex gap-2 mt-1 transition-opacity duration-300">
            <div className="bg-[#221F26] rounded-md px-2 py-0.5 text-xs">
              <span className="text-[#FFA500]">min: </span>
              <span className="font-mono text-gray-300">
                {formatDisplayValue(minMaxAmounts.min)} {selectedCurrency?.code}
              </span>
            </div>
            <div className="bg-[#221F26] rounded-md px-2 py-0.5 text-xs">
              <span className="text-[#FFA500]">max: </span>
              <span className="font-mono text-gray-300">
                {formatDisplayValue(minMaxAmounts.max)} {selectedCurrency?.code}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
