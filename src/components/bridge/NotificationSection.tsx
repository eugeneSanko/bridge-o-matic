
import { Bell, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

export const NotificationSection = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";
  
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    if (!orderId || !token) {
      toast({
        title: "Missing Data",
        description: "Order information is not available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the transaction URL
      const url = `${window.location.origin}/bridge/awaiting-deposit?orderId=${orderId}&token=${token}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(url);
      
      setCopied(true);
      
      toast({
        title: "URL Copied",
        description: "Transaction URL copied to clipboard",
        variant: "default",
      });
      
      // Reset the copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Error copying URL:", error);
      toast({
        title: "Copy Error",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="md:col-span-4 glass-card p-6 rounded-xl col-span-12">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-[#0FA0CE]" />
        <h3 className="text-lg font-medium">Monitor Your Trade</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Copy this URL to monitor your transaction status from any device.
        </p>
        
        <div className="bg-secondary/30 rounded-md p-2 flex items-center justify-between">
          <div className="truncate text-sm">
            {orderId ? `${window.location.origin}/bridge/awaiting-deposit?orderId=${orderId.substring(0, 6)}...` : "Loading..."}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#0FA0CE]"
            onClick={handleCopyUrl}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                Copy
              </span>
            )}
          </Button>
        </div>
        
        <Button
          onClick={handleCopyUrl}
          className="w-full bg-[#0FA0CE] hover:bg-[#0FA0CE]/90"
          disabled={!orderId || !token}
        >
          Copy Tracking URL
        </Button>
        
        <p className="text-xs text-gray-400 italic">
          Bookmark this page or save the URL to check your transaction status later.
        </p>
      </div>
    </div>
  );
};
