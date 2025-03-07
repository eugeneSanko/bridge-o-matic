
import { ArrowRight } from "lucide-react";

interface TransactionSummaryProps {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  destinationAddress: string;
}

export const TransactionSummary = ({ 
  fromCurrency,
  toCurrency,
  amount,
  destinationAddress 
}: TransactionSummaryProps) => {
  const formattedAddress = destinationAddress.length > 20
    ? `${destinationAddress.slice(0, 10)}...${destinationAddress.slice(-10)}`
    : destinationAddress;

  return (
    <div className="glass-card p-4 rounded-xl mb-8 bg-gradient-to-r from-bridge-card to-bridge-card/80">
      <div className="flex flex-col sm:flex-row items-center justify-between p-2">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3">
            <img src={`/${fromCurrency.toLowerCase()}.svg`} alt={fromCurrency} className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400">From</div>
            <div className="font-bold">{amount} {fromCurrency}</div>
          </div>
        </div>

        <div className="flex-shrink-0 mb-4 sm:mb-0">
          <ArrowRight className="w-6 h-6 text-bridge-accent" />
        </div>

        <div className="flex items-center mb-4 sm:mb-0">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3">
            <img src={`/${toCurrency.toLowerCase()}.svg`} alt={toCurrency} className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400">To</div>
            <div className="font-bold">{toCurrency}</div>
          </div>
        </div>

        <div className="ml-0 sm:ml-4 text-right">
          <div className="text-xs text-gray-400">Destination</div>
          <div className="font-mono text-xs">{formattedAddress}</div>
        </div>
      </div>
    </div>
  );
};
