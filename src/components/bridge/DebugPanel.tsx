
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
                      const curlCmd = debugInfo.curlCommand || `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: bzplvDU0N2Pa5crmQTbqteew6WJyuSGX9BEBPclU" \\
  -H "X-API-SIGN: $(echo -n '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' | openssl dgst -sha256 -hmac \"qIk7Vd6b5M3wqOmD3cnqRGQ6k3dGTDss47fvdng4\" | awk '{print $2}')" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' \\
  "https://ff.io/api/v2/create" -L`;
                      copyToClipboard(curlCmd, "cURL command");
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <pre className="text-xs whitespace-pre-wrap overflow-x-auto pr-16">
{debugInfo.curlCommand || `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: bzplvDU0N2Pa5crmQTbqteew6WJyuSGX9BEBPclU" \\
  -H "X-API-SIGN: $(echo -n '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' | openssl dgst -sha256 -hmac \"qIk7Vd6b5M3wqOmD3cnqRGQ6k3dGTDss47fvdng4\" | awk '{print $2}')" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' \\
  "https://ff.io/api/v2/create" -L`}
                  </pre>
                </div>
              </div>
              
              {/* Response Section - Enhanced */}
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
                        copyToClipboard(debugInfo.responseDetails?.body || "", "Response body");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  
                  {/* Headers section */}
                  {debugInfo.responseDetails?.headers && (
                    <div className="mt-2">
                      <div className="text-xs text-[#0FA0CE] mb-1">Headers:</div>
                      <pre className="text-xs overflow-x-auto bg-black/20 p-2 rounded">
                        {JSON.stringify(debugInfo.responseDetails.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Body section with improved formatting */}
                  <div className="mt-2">
                    <div className="text-xs text-[#0FA0CE] mb-1">Response Body:</div>
                    {debugInfo.responseDetails?.body ? (
                      <div className="overflow-x-auto bg-black/20 p-2 rounded">
                        {(() => {
                          try {
                            // Try to parse and format JSON
                            const parsed = JSON.parse(debugInfo.responseDetails.body);
                            return (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(parsed, null, 2)}
                              </pre>
                            );
                          } catch (e) {
                            // If not valid JSON, display as text
                            return (
                              <pre className="text-xs whitespace-pre-wrap">
                                {debugInfo.responseDetails.body}
                              </pre>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">No response body available</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Error Section (if present) */}
              {debugInfo.error && (
                <div className="space-y-2">
                  <div className="font-medium text-red-500">Error</div>
                  <div className="bg-red-900/20 p-3 rounded-md font-mono overflow-x-auto">
                    <div>Type: {debugInfo.error.type || 'Unknown Error'}</div>
                    <div>Message: {debugInfo.error.message || debugInfo.error}</div>
                    {debugInfo.error.stack && (
                      <div className="mt-2">
                        <div className="text-xs text-red-400 mb-1">Stack Trace:</div>
                        <pre className="text-xs overflow-x-auto bg-black/20 p-2 rounded whitespace-pre-wrap">
                          {debugInfo.error.stack}
                        </pre>
                      </div>
                    )}
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
