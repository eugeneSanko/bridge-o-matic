
import { ArrowRight } from "lucide-react";
import { AddressPlaceholder } from "./AddressPlaceholder";

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
  // Determine currency symbols for visual display
  const getCurrencyIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return '₿';
    if (lowerCurrency === 'eth') return 'Ξ';
    if (lowerCurrency === 'sol') return '◎';
    return currency.toUpperCase().substring(0, 1);
  };

  // Determine background colors based on currency
  const getCurrencyColor = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return 'bg-[#F7931A]';
    if (lowerCurrency === 'eth') return 'bg-[#627EEA]';
    if (lowerCurrency === 'sol') return 'bg-[#9945FF]';
    return 'bg-[#0FA0CE]';
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="glass-card p-8 md:p-12 rounded-xl mb-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0FA0CE]/20 to-transparent" />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 relative">
        <div className="flex-1 w-full md:w-auto">
          <div className="text-sm text-gray-400 mb-3">YOU SEND</div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${getCurrencyColor(fromCurrency)} flex items-center justify-center text-lg font-bold text-white`}>
              {getCurrencyIcon(fromCurrency)}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2">{amount} {fromCurrency?.toUpperCase()}</div>
              <div className="text-sm text-gray-400 font-mono">
                {destinationAddress ? formatAddress(destinationAddress) : <AddressPlaceholder />}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/20 flex items-center justify-center">
          <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-[#0FA0CE]" />
        </div>
        
        <div className="flex-1 w-full md:w-auto">
          <div className="text-sm text-gray-400 mb-3">YOU RECEIVE</div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${getCurrencyColor(toCurrency)} flex items-center justify-center text-lg font-bold text-white`}>
              {getCurrencyIcon(toCurrency)}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {/* Exact amount will be determined upon completion */}
                {/* Showing the currency only */}
                {toCurrency?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400 font-mono">{formatAddress(destinationAddress)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
