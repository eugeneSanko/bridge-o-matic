import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressPlaceholder } from "./AddressPlaceholder";
import { toast } from "sonner";

interface AddressDetailsProps {
  depositAddress: string;
  destinationAddress: string;
  onCopyClick: () => void;
  addressAlt?: string | null;
  orderType: "fixed" | "float";
  fromCurrency: string;
  fromCurrencyName?: string;
  currentStatus?: string;
  fromNetwork?: string;
  toNetwork?: string;
}

export const AddressDetails = ({
  depositAddress,
  destinationAddress,
  onCopyClick,
  addressAlt,
  orderType,
  fromCurrency,
  fromCurrencyName,
  currentStatus,
  fromNetwork,
  toNetwork,
}: AddressDetailsProps) => {
  const hasAddress =
    depositAddress &&
    depositAddress !== "Generating deposit address..." &&
    depositAddress !== "Generating address...";

  const formatAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const handleCopyDestination = () => {
    if (destinationAddress) {
      navigator.clipboard
        .writeText(destinationAddress)
        .then(() => {
          toast.success("Destination address copied!");
        })
        .catch((err) => {
          console.error("Failed to copy the address:", err);
          toast.error("Failed to copy address");
        });
    }
  };

  const handleCopyDeposit = () => {
    if (hasAddress) {
      navigator.clipboard
        .writeText(depositAddress)
        .then(() => {
          toast.success("Deposit address copied!");
          // Call the provided onCopyClick callback
        })
        .catch((err) => {
          console.error("Failed to copy the address:", err);
          toast.error("Failed to copy address");
        });
    }
  };

  // Format the currency display to show both code and name if available
  const currencyDisplay = fromCurrencyName
    ? `${fromCurrency.toUpperCase()} - ${fromCurrencyName}`
    : fromCurrency.toUpperCase();

  // Check if status is emergency or expired
  const isEmergencyOrExpired =
    currentStatus === "EMERGENCY" ||
    currentStatus === "EXPIRED" ||
    currentStatus === "emergency" ||
    currentStatus === "expired";

  return (
    <div className="md:col-span-4 glass-card p-6 rounded-xl col-span-5">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">
            Send funds to{" "}
            <span className="mb-2 text-[#9b87f5] font-semibold">
              {currencyDisplay}
            </span>
          </div>
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
              onClick={handleCopyDeposit}
              disabled={!hasAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {addressAlt && (
          <div className="py-4 px-6 bg-secondary/20 rounded-lg text-sm text-gray-300">
            <p className="mb-2 text-[#9b87f5] font-semibold">
              Alternative Address:
            </p>
            <p className="font-mono break-all">{addressAlt}</p>
          </div>
        )}

        <div className="py-4 px-6 bg-secondary/20 rounded-lg text-sm text-gray-300 glass-card">
          {orderType === "fixed" ? (
            <>
              <p>
                The exchange rate is fixed for this transaction. Your final
                amount is guaranteed as long as you send the exact amount.
              </p>
              <p className="mt-2">
                Please send the exact amount to the address above to complete
                your exchange.
              </p>
            </>
          ) : (
            <>
              <p>
                The exchange rate will be determined at the moment your deposit
                is confirmed by the network.
              </p>
              <p className="mt-2">
                Market fluctuations may affect the final amount you receive.
              </p>
              {orderType === "float" && isEmergencyOrExpired && (
                <p className="mt-2 text-amber-400 font-medium">
                  Attention: if the market rate changes by more than 1.2% before
                  the appearance of the transaction in blockchain network, you
                  will be asked to make refund or continue exchanging at market
                  rate.
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-2">
            Your receiving address
          </div>
          <div className="relative h-12 px-4 break-all text-gray-300 bg-green-500/30 rounded-lg pr-24 font-mono text-sm flex items-center">
            <span>{formatAddress(destinationAddress)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleCopyDestination}
              disabled={!destinationAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
