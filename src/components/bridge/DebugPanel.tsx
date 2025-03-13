
import { useState } from "react";
import { 
  RequestSection, 
  ResponseSection, 
  SignatureSection,
  CurlCommandSection,
  ErrorSection
} from "./debug";

interface DebugPanelProps {
  debugInfo: any;
  isLoading?: boolean;
  savedTransaction?: any;
}

export const DebugPanel = ({ 
  debugInfo, 
  isLoading = false,
  savedTransaction
}: DebugPanelProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-xl overflow-hidden">
        <div className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <span>Debug Information</span>
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#0FA0CE]"></div>
        </div>
        <div className="text-gray-400">Loading debug information...</div>
      </div>
    );
  }

  if (!debugInfo) return null;

  return (
    <div className="glass-card p-6 rounded-xl overflow-hidden">
      <div 
        className="text-lg font-semibold text-white mb-4 cursor-pointer flex items-center justify-between"
        onClick={toggleExpanded}
      >
        <span>Debug Information</span>
        <span className="text-xs px-2 py-1 bg-gray-800 rounded">
          {expanded ? "Hide" : "Show"}
        </span>
      </div>

      {expanded && (
        <div className="space-y-6 overflow-x-auto text-xs">
          {debugInfo.requestDetails && (
            <RequestSection requestDetails={debugInfo.requestDetails} />
          )}
          
          {debugInfo.signatureInfo && (
            <SignatureSection signatureInfo={debugInfo.signatureInfo} />
          )}

          {debugInfo.curlCommand && (
            <CurlCommandSection command={debugInfo.curlCommand} />
          )}

          {debugInfo.responseDetails && (
            <ResponseSection responseDetails={debugInfo.responseDetails} />
          )}

          {debugInfo.error && (
            <ErrorSection error={debugInfo.error} />
          )}
          
          {savedTransaction && (
            <div className="space-y-2">
              <div className="font-medium text-green-500">
                Transaction Saved to Database
              </div>
              <div className="bg-black/30 p-3 rounded-md font-mono">
                <pre className="overflow-x-auto">
                  {JSON.stringify(savedTransaction, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
