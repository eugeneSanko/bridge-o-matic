
import { ArrowRight } from "lucide-react";
import { AddressPlaceholder } from "./AddressPlaceholder";

interface TransactionSummaryProps {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  destinationAddress: string;
  receiveAmount?: string;
  orderType?: "fixed" | "float";
  depositAddress?: string;
}

export const TransactionSummary = ({ 
  fromCurrency, 
  toCurrency, 
  amount, 
  destinationAddress,
  receiveAmount,
  orderType = "fixed",
  depositAddress = ""
}: TransactionSummaryProps) => {
  const getCurrencyIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return '₿';
    if (lowerCurrency === 'eth') return 'Ξ';
    if (lowerCurrency === 'sol') return '◎';
    return currency.toUpperCase().substring(0, 1);
  };

  const getCurrencyImageUrl = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    
    if (lowerCurrency === 'btc') return 'https://ff.io/assets/images/coins/svg/btc.svg';
    if (lowerCurrency === 'eth') return 'https://ff.io/assets/images/coins/svg/eth_dark.svg';
    if (lowerCurrency === 'sol') return 'https://ff.io/assets/images/coins/svg/sol.svg';
    if (lowerCurrency === 'usdt') return 'https://ff.io/assets/images/coins/svg/usdt.svg';
    if (lowerCurrency === 'usdc') return 'https://ff.io/assets/images/coins/svg/usdceth.svg';
    if (lowerCurrency === 'usdttrc') return 'https://ff.io/assets/images/coins/svg/usdttrc.svg';
    
    return `https://ff.io/assets/images/coins/svg/${lowerCurrency}.svg`;
  };

  const getCurrencyColor = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return 'bg-[#F7931A]';
    if (lowerCurrency === 'eth') return 'bg-[#627EEA]';
    if (lowerCurrency === 'sol') return 'bg-[#9945FF]';
    if (lowerCurrency === 'usdt') return 'bg-[#26A17B]';
    if (lowerCurrency === 'usdc') return 'bg-[#2775CA]';
    if (lowerCurrency === 'usdttrc') return 'bg-[#53AE94]';
    return 'bg-[#0FA0CE]';
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="bg-[#1A1F3C] p-8 rounded-xl mb-8">
      <div className="flex flex-col items-center justify-between gap-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-11 w-full items-center text-center">
          {/* YOU SEND section */}
          <div className="col-span-5 flex flex-col items-center">
            <div className="text-sm text-gray-400 uppercase mb-2">YOU SEND</div>
            <div className="text-4xl font-bold text-white mb-2">{amount} {fromCurrency?.toUpperCase()}</div>
            <div className="text-xs text-gray-400 font-mono truncate max-w-full">
              {depositAddress ? formatAddress(depositAddress) : 'Generating address...'}
            </div>
          </div>
          
          {/* Center logo with arrow */}
          <div className="col-span-1 flex justify-center items-center my-6 md:my-0">
            <div className="relative">
              <img 
                src={getCurrencyImageUrl(fromCurrency)}
                alt={fromCurrency}
                className="w-10 h-10 absolute opacity-25 blur-sm"
                style={{ left: '-30px', zIndex: 0 }}
              />
              <ArrowRight className="w-8 h-8 text-white relative z-10" />
              <img 
                src={getCurrencyImageUrl(toCurrency)}
                alt={toCurrency}
                className="w-10 h-10 absolute opacity-25 blur-sm"
                style={{ right: '-30px', zIndex: 0 }}
              />
            </div>
          </div>
          
          {/* YOU RECEIVE section */}
          <div className="col-span-5 flex flex-col items-center">
            <div className="text-sm text-gray-400 uppercase mb-2">YOU RECEIVE</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-12 h-12 rounded-full ${getCurrencyColor(toCurrency)} flex items-center justify-center overflow-hidden`}>
                <img 
                  src={getCurrencyImageUrl(toCurrency)}
                  alt={toCurrency}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerText = getCurrencyIcon(toCurrency);
                  }}
                />
              </div>
              <div className="text-4xl font-bold text-[#F7931A]">
                {orderType === "float" && <span className="text-gray-400 mr-1">≈</span>}
                {receiveAmount || ""} {toCurrency?.toUpperCase()}
              </div>
            </div>
            <div className="text-xs text-gray-400 font-mono truncate max-w-full">
              {formatAddress(destinationAddress)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
