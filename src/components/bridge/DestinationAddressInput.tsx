
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode, Clipboard } from "lucide-react";

interface DestinationAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  borderColor?: string;
  receivingCurrency?: string;
  currencyNetwork?: string | null;
}

export const DestinationAddressInput = ({
  value,
  onChange,
  borderColor,
  receivingCurrency,
  currencyNetwork,
}: DestinationAddressInputProps) => {
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onChange(clipboardText);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const borderStyle = borderColor
    ? {
        borderColor: borderColor,
        borderWidth: "2px",
      }
    : {};

  // Construct dynamic network label
  let networkLabel = "Destination Wallet Address";
  if (currencyNetwork) {
    networkLabel += ` (${currencyNetwork})`;
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-300">
        {networkLabel}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-[90px] bg-secondary/30 h-[3.5rem] sm:h-16 transition-all duration-200"
            placeholder="Enter destination address"
            style={borderStyle}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button variant="ghost" size="icon" title="Scan QR code">
              <QrCode className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePaste} title="Paste from clipboard">
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
