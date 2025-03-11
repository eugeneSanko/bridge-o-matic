
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressPlaceholder } from "./AddressPlaceholder";

interface AddressDetailsProps {
  depositAddress: string;
  destinationAddress: string;
  onCopyClick: () => void;
  addressAlt?: string | null;
  orderType: "fixed" | "float";
}

export const AddressDetails = ({ 
  depositAddress, 
  destinationAddress, 
  onCopyClick, 
  addressAlt,
  orderType
}: AddressDetailsProps) => {
  const hasAddress = depositAddress && depositAddress !== "Generating deposit address..." && depositAddress !== "Generating address...";
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  return (
    <div className="col-span-5 glass-card p-6 rounded-xl">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Send funds to</div>
          <div className="relative">
            <div className="w-full h-12 px-4 bg-secondary/30 rounded-lg pr-24 font-mono text-sm flex items-center">
              {hasAddress ? (
                <span className="truncate">{depositAddress}</span>
              ) : (
                <AddressPlaceholder />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={onCopyClick}
              disabled={!hasAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {addressAlt && (
          <div className="py-4 px-6 bg-secondary/20 rounded-lg text-sm text-gray-300">
            <p className="mb-2 text-[#9b87f5] font-semibold">Alternative Address:</p>
            <p className="font-mono break-all">{addressAlt}</p>
          </div>
        )}

        <div className="py-4 px-6 bg-secondary/20 rounded-lg text-sm text-gray-300">
          {orderType === 'fixed' ? (
            <>
              <p>The exchange rate is fixed for this transaction. Your final amount is guaranteed as long as you send the exact amount.</p>
              <p className="mt-2">Please send the exact amount to the address above to complete your exchange.</p>
            </>
          ) : (
            <>
              <p>The exchange rate will be determined at the moment your deposit is confirmed by the network.</p>
              <p className="mt-2">Market fluctuations may affect the final amount you receive.</p>
            </>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-2">Your receiving address</div>
          <div className="text-sm font-mono break-all text-gray-300">
            {formatAddress(destinationAddress)}
          </div>
        </div>
      </div>
    </div>
  );
};
