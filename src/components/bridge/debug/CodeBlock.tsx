
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

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

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  const renderContent = () => {
    if (tryParseJson) {
      try {
        // Try to parse and format JSON
        const parsed = JSON.parse(content);
        return (
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch (e) {
        // If not valid JSON, display as text
        return (
          <pre className="text-xs whitespace-pre-wrap">{content}</pre>
        );
      }
    }
    
    // If not trying to parse as JSON
    return <pre className="text-xs whitespace-pre-wrap">{content}</pre>;
  };

  return (
    <div className="relative">
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-5 px-1"
          onClick={copyToClipboard}
        >
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
      )}
      {renderContent()}
    </div>
  );
};
