
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Clipboard } from "lucide-react";

interface DestinationAddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const DestinationAddressInput = ({ value, onChange }: DestinationAddressInputProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-300">Destination Address</label>
      <div className="relative">
        <Input 
          type="text" 
          placeholder="Enter destination address" 
          className="h-[3.5rem] sm:h-[4.5rem] px-3 sm:px-4 bg-secondary/30 pr-24 sm:pr-32 text-sm sm:text-base"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
