
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { Currency } from "@/contexts/BridgeContext";

interface CurrencySelectorProps {
  label: string;
  value: Currency | null;
  onChange: (currency: Currency | null) => void;
  onAmountChange?: (amount: string) => void;
  amount?: string;
  estimatedAmount?: string;
  isCalculating?: boolean;
  timeRemaining?: number;
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
  isReceiveSide = false
}: CurrencySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencySelect = (currency: Currency) => {
    onChange(currency);
    setIsOpen(false);
  };

  const handleClearCurrency = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (onAmountChange) {
      onAmountChange("");
    }
  };

  return (
    <div className="flex-1 rounded-xl min-h-[240px] glass-card p-5">
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      </div>

      <div className="mb-4 relative">
        <button
          className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {value ? (
            <div className="flex items-center">
              <div className="mr-2 w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                <img src={value.img} alt={value.name} className="w-full h-auto" />
              </div>
              <span className="font-medium">{value.symbol}</span>
              {value.testnet && (
                <span className="ml-2 text-xs py-0.5 px-1.5 bg-yellow-600/30 text-yellow-400 rounded">
                  Testnet
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">Select currency</span>
          )}

          <div className="flex items-center">
            {value && (
              <button
                onClick={handleClearCurrency}
                className="mr-2 p-1 hover:bg-gray-700/50 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 z-10 glass-card rounded-lg border border-white/10 overflow-hidden max-h-[240px] overflow-y-auto"
            >
              {isLoadingCurrencies ? (
                <div className="p-4 text-center">
                  <div className="inline-block w-5 h-5 border-t-2 border-bridge-accent animate-spin rounded-full"></div>
                  <p className="text-sm text-gray-400 mt-2">Loading currencies...</p>
                </div>
              ) : (
                <ul>
                  {availableCurrencies.map((currency) => (
                    <li key={currency.id}>
                      <button
                        className="w-full flex items-center p-3 hover:bg-white/5 transition-colors"
                        onClick={() => handleCurrencySelect(currency)}
                        type="button"
                      >
                        <div className="mr-2 w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                          <img src={currency.img} alt={currency.name} className="w-full h-auto" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{currency.symbol}</span>
                          <span className="text-xs text-gray-400">{currency.name}</span>
                        </div>
                        {currency.testnet && (
                          <span className="ml-auto text-xs py-0.5 px-1.5 bg-yellow-600/30 text-yellow-400 rounded">
                            Testnet
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isReceiveSide ? (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              className="w-full p-3 bg-gray-800/50 rounded-lg border border-white/5 focus:border-white/20 transition-all focus:outline-none font-medium"
              disabled={!value}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Estimated amount</label>
            {timeRemaining !== undefined && timeRemaining > 0 && (
              <div className="text-xs text-gray-400">
                Refreshes in {timeRemaining}s
              </div>
            )}
          </div>
          <div className="relative">
            <div className="w-full p-3 bg-gray-800/50 rounded-lg border border-white/5 font-medium min-h-[46px] flex items-center">
              {isCalculating ? (
                <div className="flex items-center text-gray-400">
                  <div className="w-4 h-4 border-t-2 border-bridge-accent animate-spin rounded-full mr-2"></div>
                  <span>Calculating...</span>
                </div>
              ) : estimatedAmount ? (
                estimatedAmount
              ) : (
                <span className="text-gray-500">--</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
