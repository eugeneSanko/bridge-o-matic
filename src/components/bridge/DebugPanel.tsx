
import { useState } from "react";
import { Code, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DebugPanelProps {
  debugInfo?: any;
  isLoading?: boolean;
}

export const DebugPanel = ({ debugInfo, isLoading = false }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  
  if (!debugInfo && !isLoading) return null;
  
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };
  
  return (
    <div className="glass-card p-4 rounded-xl mt-6 text-xs">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpand}>
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-[#0FA0CE]" />
          <h3 className="font-medium">Bridge API Debug Information</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-gray-400 italic">Loading debug information...</div>
          ) : debugInfo ? (
            <>
              {/* Request Section */}
              <div className="space-y-2">
                <div className="font-medium text-[#0FA0CE]">Request Details</div>
                <div className="bg-black/30 p-3 rounded-md font-mono overflow-x-auto">
                  <div className="flex justify-between">
                    <div>URL: {debugInfo.requestDetails?.url}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(JSON.stringify(debugInfo.requestDetails?.requestBody, null, 2), "Request body");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.requestDetails?.requestBody, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Signature Section */}
              <div className="space-y-2">
                <div className="font-medium text-[#0FA0CE]">Signature Details</div>
                <div className="bg-black/30 p-3 rounded-md font-mono overflow-x-auto">
                  <div>API Key: {debugInfo.signatureInfo?.apiKey}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="truncate">Signature: {debugInfo.signatureInfo?.signature}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1 ml-2 flex-shrink-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(debugInfo.signatureInfo?.signature, "Signature");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* CURL Command */}
              <div className="space-y-2">
                <div className="font-medium text-[#0FA0CE]">cURL Command</div>
                <div className="bg-black/30 p-3 rounded-md font-mono overflow-x-auto relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-5 px-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(debugInfo.curlCommand, "cURL command");
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <pre className="text-xs whitespace-pre-wrap overflow-x-auto pr-16">
                    {debugInfo.curlCommand}
                  </pre>
                </div>
              </div>
              
              {/* Response Section */}
              <div className="space-y-2">
                <div className="font-medium text-[#0FA0CE]">Response Details</div>
                <div className="bg-black/30 p-3 rounded-md font-mono overflow-x-auto">
                  <div className="flex justify-between">
                    <div>Status: {debugInfo.responseDetails?.status}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(debugInfo.responseDetails?.body, "Response body");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {debugInfo.responseDetails?.body}
                  </pre>
                </div>
              </div>
              
              {/* Error Section (if present) */}
              {debugInfo.error && (
                <div className="space-y-2">
                  <div className="font-medium text-red-500">Error</div>
                  <div className="bg-red-900/20 p-3 rounded-md font-mono overflow-x-auto">
                    <div>Type: {debugInfo.error.type}</div>
                    <div>Message: {debugInfo.error.message}</div>
                    {debugInfo.error.responseText && (
                      <pre className="mt-2 text-xs overflow-x-auto">
                        {debugInfo.error.responseText}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 italic">No debug information available</div>
          )}
        </div>
      )}
    </div>
  );
};
