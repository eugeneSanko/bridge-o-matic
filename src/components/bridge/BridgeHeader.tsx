
import { Button } from "@/components/ui/button";
import { Beaker } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import CryptoJS from 'crypto-js';
import { DebugPanel } from "./DebugPanel";
import { supabase } from "@/integrations/supabase/client";

// Define proper types for debug info
interface DebugInfo {
  requestDetails: {
    url: string;
    method: string;
    requestBody: any;
    requestBodyString: string;
  };
  signatureInfo: {
    signature: string;
    apiKey: string;
  };
  curlCommand: string;
  responseDetails: {
    status: string;
    body: string;
    headers?: Record<string, string>;
  };
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

export const BridgeHeader = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testDebugInfo, setTestDebugInfo] = useState<DebugInfo | null>(null);

  const testApi = async () => {
    setIsTestingApi(true);
    try {
      console.log("Starting API test...");
      toast({
        title: "Testing API connection",
        description: "Please wait while we test the connection to FixedFloat API...",
      });

      // Sample request body for testing
      const sampleRequestBody = {
        fromCcy: "BTC",
        toCcy: "SOL",
        amount: 0.01,
        direction: "from",
        type: "float",
        toAddress: "VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY"
      };
      
      const bodyString = JSON.stringify(sampleRequestBody);
      
      // Create signature locally to show in debug
      const signature = CryptoJS.HmacSHA256(bodyString, API_CONFIG.FF_API_SECRET).toString();
      console.log("Generated API signature:", signature);
      
      // Prepare curl command for reference
      const curlCommand = `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: ${API_CONFIG.FF_API_KEY}" \\
  -H "X-API-SIGN: $(echo -n '${bodyString}' | openssl dgst -sha256 -hmac "${API_CONFIG.FF_API_SECRET}" | awk '{print $2}')" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '${bodyString}' \\
  "https://ff.io/api/v2/create" -L`;
      
      // Initial debug info with request details
      const debugInfo: DebugInfo = {
        requestDetails: {
          url: "https://ff.io/api/v2/create",
          method: "POST",
          requestBody: sampleRequestBody,
          requestBodyString: bodyString,
        },
        signatureInfo: {
          signature: signature,
          apiKey: API_CONFIG.FF_API_KEY
        },
        curlCommand,
        responseDetails: {
          status: "Pending...",
          body: "Waiting for response..."
        }
      };
      
      // Update UI immediately with request info
      setTestDebugInfo(debugInfo);
      
      // Make an actual API call via the edge function
      console.log("Making API request to edge function...");
      const { data, error } = await supabase.functions.invoke('bridge-create', {
        body: sampleRequestBody
      });
      
      if (error) {
        console.error("Edge function error:", error);
        debugInfo.responseDetails = {
          status: `Error: ${error.status || 500}`,
          body: JSON.stringify({ error: error.message })
        };
        debugInfo.error = {
          type: error.name || "Error",
          message: error.message,
          stack: error.stack
        };
      } else {
        console.log("API response:", data);
        // Update debug info with actual response
        debugInfo.responseDetails = {
          status: data?.debugInfo?.responseDetails?.status || 200,
          body: data?.debugInfo?.responseDetails?.body || JSON.stringify(data)
        };
        
        // If there are headers in the response data, add them
        if (data?.debugInfo?.responseDetails?.headers) {
          debugInfo.responseDetails.headers = data.debugInfo.responseDetails.headers;
        }
        
        // If there's an error in the API response, capture it
        if (data?.error || data?.debugInfo?.error) {
          debugInfo.error = data?.debugInfo?.error || { 
            type: "API Error", 
            message: typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error)
          };
        }
      }
      
      // Update the UI with the full debug info including response
      setTestDebugInfo({...debugInfo});
      
      toast({
        title: "API Test Complete",
        description: "API test completed. See details below.",
        variant: "default",
      });
    } catch (error) {
      console.error("API test error:", error);
      
      // Update debug info with the caught error
      if (testDebugInfo) {
        const updatedDebugInfo = {...testDebugInfo};
        updatedDebugInfo.error = {
          type: error instanceof Error ? error.constructor.name : "Unknown Error",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };
        updatedDebugInfo.responseDetails = {
          status: "Error",
          body: error instanceof Error ? error.message : String(error)
        };
        setTestDebugInfo(updatedDebugInfo);
      }
      
      toast({
        title: "API Test Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to test API connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-wrap gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Tradenly Bridge
        </h1>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={testApi}
            disabled={isTestingApi}
            className="flex items-center gap-1 text-[#0FA0CE] hover:text-[#0FA0CE] border-[#0FA0CE] hover:border-[#0FA0CE] hover:bg-[#0FA0CE]/10"
          >
            <Beaker className="w-4 h-4" />
            {isTestingApi ? "Testing..." : "Test API"}
          </Button>
        </div>
      </div>

      <div className="text-gray-400 mb-8 sm:mb-12 space-y-2">
        <p>The exchange service is provided by FixedFloat.</p>
        <p>
          Creating an order confirms your agreement with the FixedFloat rules.
        </p>
      </div>
      
      {testDebugInfo && (
        <DebugPanel debugInfo={testDebugInfo} isLoading={isTestingApi} />
      )}
    </>
  );
};
