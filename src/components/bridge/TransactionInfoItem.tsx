
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TransactionInfoItemProps {
  label: string;
  value: string | number | null;
  isTxId?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  copyable?: boolean;
}

export const TransactionInfoItem = ({
  label,
  value,
  isTxId = false,
  isLink = false,
  linkUrl = "",
  copyable = false,
}: TransactionInfoItemProps) => {
  const { toast } = useToast();

  // Format a transaction ID to show beginning and end with ellipsis in middle
  const formatTxId = (txId: string) => {
    if (!txId) return "N/A";
    if (txId.length <= 20) return txId;
    return `${txId.slice(0, 12)}...${txId.slice(-12)}`;
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value.toString()).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied.`,
      });
    });
  };

  // Determine the actual value to display
  const displayValue = isTxId && typeof value === 'string' 
    ? formatTxId(value) 
    : value || "N/A";

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-400">{label}</span>
      <div className="font-mono text-sm text-white flex items-center gap-2">
        {isLink && linkUrl ? (
          <a 
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {displayValue}
          </a>
        ) : (
          <span className={isTxId ? "max-w-[200px] truncate" : ""}>{displayValue}</span>
        )}
        
        {copyable && value && (
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={handleCopy}>
            <Copy className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
    </div>
  );
};
