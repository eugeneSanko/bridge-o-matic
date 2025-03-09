
import { useState } from "react";
import { Code, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RequestSection,
  SignatureSection,
  CurlCommandSection,
  ResponseSection,
  ErrorSection,
} from "./debug";

interface DebugInfo {
  requestDetails?: {
    url: string;
    method: string;
    requestBody: any;
    requestBodyString: string;
  };
  signatureInfo?: {
    signature: string;
    apiKey: string;
  };
  curlCommand?: string;
  responseDetails?: {
    status: string;
    body: string;
    headers?: Record<string, string>;
  };
  error?: {
    type: string;
    message: string;
    stack?: string;
    responseText?: string;
  };
}

interface DebugPanelProps {
  debugInfo?: DebugInfo;
  isLoading?: boolean;
}

export const DebugPanel = ({ debugInfo, isLoading = false }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!debugInfo && !isLoading) return null;
  
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
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
              <RequestSection requestDetails={debugInfo.requestDetails} />
              <SignatureSection signatureInfo={debugInfo.signatureInfo} />
              <CurlCommandSection curlCommand={debugInfo.curlCommand} />
              <ResponseSection responseDetails={debugInfo.responseDetails} />
              <ErrorSection error={debugInfo.error} />
            </>
          ) : (
            <div className="text-gray-400 italic">No debug information available</div>
          )}
        </div>
      )}
    </div>
  );
};
