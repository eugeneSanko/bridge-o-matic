import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  content: string;
  label: string;
  showCopyButton?: boolean;
  tryParseJson?: boolean;
}

export const CodeBlock = ({ 
  content, 
  label, 
  showCopyButton = true,
  tryParseJson = true 
}: CodeBlockProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: `${label} has been copied to your clipboard.`,
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive"
        });
      });
  };

  // Format long strings like transaction IDs with ellipsis in the middle
  const formatLongString = (str: string) => {
    if (str.length > 50) {
      return `${str.substring(0, 24)}...${str.substring(str.length - 24)}`;
    }
    return str;
  };

  const renderContent = () => {
    if (tryParseJson) {
      try {
        // Try to parse and format JSON
        const parsed = JSON.parse(content);
        
        // Process specific fields like transaction IDs for better display
        const processJsonForDisplay = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return obj;
          
          // Create a new object to avoid mutating the original
          const result = Array.isArray(obj) ? [] : {};
          
          Object.entries(obj).forEach(([key, value]) => {
            // If it looks like a transaction ID and is a string
            if (
              typeof value === 'string' && 
              (key === 'id' || key.toLowerCase().includes('tx')) && 
              value.length > 50
            ) {
              // Format transaction IDs
              result[key] = formatLongString(value);
            } 
            // Recurse for nested objects
            else if (value && typeof value === 'object') {
              result[key] = processJsonForDisplay(value);
            } 
            // Keep other values as is
            else {
              result[key] = value;
            }
          });
          
          return result;
        };
        
        const displayObj = processJsonForDisplay(parsed);
        
        return (
          <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(displayObj, null, 2)}
          </pre>
        );
      } catch (e) {
        // If not valid JSON, display as text
        return (
          <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
            {content}
          </pre>
        );
      }
    }
    
    // If not trying to parse as JSON
    return (
      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
        {content}
      </pre>
    );
  };

  return (
    <div className="relative">
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 h-6 px-2 transition-colors ${copied ? 'bg-green-500/20 text-green-500' : ''}`}
          onClick={copyToClipboard}
        >
          <Copy className="h-3 w-3 mr-1" /> {copied ? "Copied!" : "Copy"}
        </Button>
      )}
      {renderContent()}
    </div>
  );
};
