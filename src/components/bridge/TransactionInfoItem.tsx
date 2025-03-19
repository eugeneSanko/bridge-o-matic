
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getExplorerUrl, hasExplorerUrl, getNetworkName, isNetworkAvailable } from "@/utils/explorerUtils";

interface TransactionInfoItemProps {
  label: string;
  value: string | number | null;
  isTxId?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  copyable?: boolean;
  network?: string; // Network prop for explorer links
}

export const TransactionInfoItem = ({
  label,
  value,
  isTxId = false,
  isLink = false,
  linkUrl = "",
  copyable = false,
  network = "", // Default to empty string
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

  // Check if we can show an explorer link for this transaction
  const hasExplorer = isTxId && typeof value === 'string' && network && hasExplorerUrl(value.toString(), network);
  
  // Get explorer URL if available
  const explorerUrl = hasExplorer 
    ? getExplorerUrl(value!.toString(), network) 
    : null;

  // Get a display name for the network if available
  const networkDisplayName = network ? getNetworkName(network) : "";

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
        
        {/* Add explorer link button if applicable */}
        {hasExplorer && explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
            title={`View on ${networkDisplayName} explorer`}
          >
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <ExternalLink className="h-4 w-4 text-blue-400" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};
