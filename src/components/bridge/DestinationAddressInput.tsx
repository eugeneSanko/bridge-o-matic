
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DestinationAddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const DestinationAddressInput = ({ value, onChange }: DestinationAddressInputProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-400">
          Destination Address
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-400 hover:text-gray-300 transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Enter the wallet address where you want to receive your bridged assets
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <input
        type="text"
        placeholder="0x..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-gray-800/50 rounded-lg border border-white/5 focus:border-white/20 transition-all focus:outline-none font-mono"
      />
    </div>
  );
};
