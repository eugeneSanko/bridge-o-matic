
import { ArrowRight, Copy } from "lucide-react";
import { AddressPlaceholder } from "./AddressPlaceholder";
import { cleanSymbol } from "@/utils/symbolUtils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TransactionSummaryProps {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  destinationAddress: string;
  receiveAmount?: string;
  orderType?: "fixed" | "float";
  depositAddress?: string;
  fromCurrencyName?: string;
  toCurrencyName?: string;
}

export const TransactionSummary = ({
  fromCurrency,
  toCurrency,
  amount,
  destinationAddress,
  receiveAmount,
  orderType = "fixed",
  depositAddress = "",
  fromCurrencyName,
  toCurrencyName,
}: TransactionSummaryProps) => {
  const { toast } = useToast();
  
  const getCurrencyIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === "btc") return "₿";
    if (lowerCurrency === "eth") return "Ξ";
    if (lowerCurrency === "sol") return "◎";
    return currency.toUpperCase().substring(0, 1);
  };

  const getCurrencyImageUrl = (currency: string) => {
    // Clean the currency to remove any network information
    const cleanCurrency = cleanSymbol(currency).toLowerCase();

    if (cleanCurrency === "btc")
      return "https://ff.io/assets/images/coins/svg/btc.svg";
    if (cleanCurrency === "eth")
      return "https://ff.io/assets/images/coins/svg/eth_dark.svg";
    if (cleanCurrency === "sol")
      return "https://ff.io/assets/images/coins/svg/sol.svg";
    if (cleanCurrency === "usdt")
      return "https://ff.io/assets/images/coins/svg/usdt.svg";
    if (cleanCurrency === "usdc")
      return "https://ff.io/assets/images/coins/svg/usdceth.svg";
    if (cleanCurrency === "usdttrc")
      return "https://ff.io/assets/images/coins/svg/usdttrc.svg";

    return `https://ff.io/assets/images/coins/svg/${cleanCurrency}.svg`;
  };

  const getCurrencyColor = (currency: string) => {
    // Clean the currency to remove any network information
    const cleanCurrency = cleanSymbol(currency).toLowerCase();

    if (cleanCurrency === "btc") return "bg-[#F7931A]";
    if (cleanCurrency === "eth") return "bg-[#627EEA]";
    if (cleanCurrency === "sol") return "bg-[#9945FF]";
    if (cleanCurrency === "usdt") return "bg-[#26A17B]";
    if (cleanCurrency === "usdc") return "bg-[#2775CA]";
    if (cleanCurrency === "usdttrc") return "bg-[#53AE94]";
    return "bg-[#0FA0CE]";
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };
  
  const handleCopyAddress = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${type} address has been copied.`
      });
    });
  };

  // Get the clean symbol for display
  const getCleanedCurrency = (currency: string) => {
    return cleanSymbol(currency).toUpperCase();
  };

  // Format the display for from/to currencies to show both code and name
  const formatFromCurrencyDisplay = () => {
    const cleanCurrency = getCleanedCurrency(fromCurrency);

    if (fromCurrencyName) {
      return (
        <>
          {cleanCurrency}
          <sup className="text-sm text-muted-foreground ml-1">
            {fromCurrencyName}
          </sup>
        </>
      );
    }
    return cleanCurrency;
  };

  const formatToCurrencyDisplay = () => {
    const cleanCurrency = getCleanedCurrency(toCurrency);

    if (toCurrencyName) {
      return (
        <>
          {cleanCurrency}
          <sup className="text-sm text-muted-foreground ml-1">
            {toCurrencyName}
          </sup>
        </>
      );
    }
    return cleanCurrency;
  };

  return (
    <div className="glass-card p-8 md:p-12 rounded-xl mb-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#9b87f5]/30 via-[#7a64ff]/20 to-transparent backdrop-blur-sm animate-pulse-subtle" />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 relative">
        <div className="flex-1 w-full md:w-auto ">
          <div className="text-sm text-gray-400 mb-3 md:text-right">
            YOU SEND
          </div>
          <div className="flex items-center gap-4 md:flex-row-reverse">
            <div
              className={`w-12 h-12 rounded-full ${getCurrencyColor(
                fromCurrency
              )} flex items-center justify-center text-lg font-bold text-white overflow-hidden`}
            >
              <img
                src={getCurrencyImageUrl(fromCurrency)}
                alt={getCleanedCurrency(fromCurrency)}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerText =
                    getCurrencyIcon(getCleanedCurrency(fromCurrency));
                }}
              />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2 md:text-right md:flex md:flex-row-reverse">
                <div className="md:flex md:flex-row-reverse pl-1">{amount}</div>
                {formatFromCurrencyDisplay()}
              </div>
              <div className="text-sm text-gray-400 font-mono flex items-center">
                Send funds:{" "}
                {depositAddress ? (
                  <span className="flex items-center gap-1 ml-1">
                    {formatAddress(depositAddress)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0"
                      onClick={() => handleCopyAddress(depositAddress, "Deposit")}
                    >
                      <Copy className="h-3 w-3 text-gray-400" />
                    </Button>
                  </span>
                ) : (
                  "Generating address..."
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-16 h-16 md:w-12 md:h-12 rounded-full bg-secondary/20 flex items-center justify-center md:-mb-2">
          <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-[#9b87f5]" />
        </div>

        <div className="flex-1 w-full md:w-auto">
          <div className="text-sm text-gray-400 mb-3">YOU RECEIVE</div>
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full ${getCurrencyColor(
                toCurrency
              )} flex items-center justify-center text-lg font-bold text-white overflow-hidden`}
            >
              <img
                src={getCurrencyImageUrl(toCurrency)}
                alt={getCleanedCurrency(toCurrency)}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerText =
                    getCurrencyIcon(getCleanedCurrency(toCurrency));
                }}
              />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold mb-2 ">
                {orderType === "float" && (
                  <span className="text-gray-400 mr-1">≈</span>
                )}
                {receiveAmount || ""} {formatToCurrencyDisplay()}
              </div>
              <div className="text-sm text-gray-400 font-mono flex items-center">
                Receive at:{" "}
                <span className="flex items-center gap-1 ml-1">
                  {formatAddress(destinationAddress)}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0"
                    onClick={() => handleCopyAddress(destinationAddress, "Destination")}
                  >
                    <Copy className="h-3 w-3 text-gray-400" />
                  </Button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
