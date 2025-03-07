
import { useState } from "react";
import { TerminalSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Currency } from "@/contexts/BridgeContext";

interface DebugPanelProps {
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
}

export const DebugPanel = ({ availableCurrencies, isLoadingCurrencies }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors focus:outline-none"
      >
        <TerminalSquare className="w-5 h-5 text-gray-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 glass-card rounded-lg shadow-xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="font-medium text-sm">Debug Panel</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700/50 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Loading State</h4>
                <div className="p-2 bg-gray-800/50 rounded text-xs font-mono">
                  isLoadingCurrencies: {isLoadingCurrencies.toString()}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Available Currencies</h4>
                <div className="p-2 bg-gray-800/50 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(availableCurrencies, null, 2)}</pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
