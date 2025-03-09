import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode, Clipboard, AlertCircle } from "lucide-react";
import { useState } from "react";

interface DestinationAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  borderColor?: string;
  receivingCurrency?: string;
  currencyNetwork?: string | null;
  errorMessage?: string | null;
}

export const DestinationAddressInput = ({
  value,
  onChange,
  borderColor,
  receivingCurrency,
  currencyNetwork,
  errorMessage,
}: DestinationAddressInputProps) => {
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null
  );

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onChange(clipboardText);
      validateAddress(clipboardText);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const validateAddress = (address: string) => {
    // Basic alphanumeric check
    if (!/^[a-zA-Z0-9]+$/.test(address)) {
      setLocalErrorMessage("Address contains invalid characters.");
      return;
    }

    // Clear any previous error message if validation passes
    setLocalErrorMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validateAddress(newValue);
  };

  const borderStyle = borderColor
    ? {
        borderColor:
          errorMessage || localErrorMessage ? "rgb(239, 68, 68)" : borderColor,
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
      <div className="flex flex-col gap-2">
        <div className="relative flex-grow">
          <Input
            value={value}
            onChange={handleChange}
            className={`pr-[90px] bg-secondary/30 h-[3.5rem] sm:h-16 transition-all duration-200 ${
              errorMessage || localErrorMessage ? "border-red-500" : ""
            }`}
            placeholder="Enter destination address"
            style={borderStyle}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex ">
            <Button variant="ghost" size="icon" title="Scan QR code">
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePaste}
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(errorMessage || localErrorMessage) && (
          <div className="flex items-start gap-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{errorMessage || localErrorMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
};
