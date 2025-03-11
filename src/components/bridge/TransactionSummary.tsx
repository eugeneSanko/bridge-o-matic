
import { ArrowRight } from "lucide-react";
import { AddressPlaceholder } from "./AddressPlaceholder";

interface TransactionSummaryProps {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  destinationAddress: string;
  receiveAmount?: string;
  orderType?: "fixed" | "float";
}

export const TransactionSummary = ({ 
  fromCurrency, 
  toCurrency, 
  amount, 
  destinationAddress,
  receiveAmount,
  orderType = "fixed"
}: TransactionSummaryProps) => {
  // Determine currency symbols for visual display
  const getCurrencyIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return '₿';
    if (lowerCurrency === 'eth') return 'Ξ';
    if (lowerCurrency === 'sol') return '◎';
    return currency.toUpperCase().substring(0, 1);
  };

  // Get currency image URLs
  const getCurrencyImageUrl = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    return `https://ff.io/static/currencies/${lowerCurrency}.svg`;
  };

  // Determine background colors based on currency
  const getCurrencyColor = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return 'bg-[#F7931A]';
    if (lowerCurrency === 'eth') return 'bg-[#627EEA]';
    if (lowerCurrency === 'sol') return 'bg-[#9945FF]';
    if (lowerCurrency === 'usdt') return 'bg-[#26A17B]';
    if (lowerCurrency === 'usdc') return 'bg-[#2775CA]';
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
            <div className={`w-12 h-12 rounded-full ${getCurrencyColor(fromCurrency)} flex items-center justify-center text-lg font-bold text-white overflow-hidden`}>
              {/* Using FF.io currency SVG icons */}
              <img 
                src={getCurrencyImageUrl(fromCurrency)}
                alt={fromCurrency}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback to text symbol if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerText = getCurrencyIcon(fromCurrency);
                }}
              />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2">{amount} {fromCurrency?.toUpperCase()}</div>
              <div className="text-sm text-gray-400 font-mono">
                Send to: {formatAddress("0xa489b15fa7cfcd230951ad2db01f6b58eaca9f70")}
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
            <div className={`w-12 h-12 rounded-full ${getCurrencyColor(toCurrency)} flex items-center justify-center text-lg font-bold text-white overflow-hidden`}>
              {/* Using FF.io currency SVG icons */}
              <img 
                src={getCurrencyImageUrl(toCurrency)}
                alt={toCurrency}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback to text symbol if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerText = getCurrencyIcon(toCurrency);
                }}
              />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {orderType === "float" && <span className="text-gray-400 mr-1">≈</span>}
                {receiveAmount || ""} {toCurrency?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                Receive at: {formatAddress("8VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
