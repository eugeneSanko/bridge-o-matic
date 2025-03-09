
import { Button } from "@/components/ui/button";
import { Beaker } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import CryptoJS from 'crypto-js';
import { DebugPanel } from "./DebugPanel";

export const BridgeHeader = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testDebugInfo, setTestDebugInfo] = useState<any>(null);

  const testApi = async () => {
    setIsTestingApi(true);
    try {
      console.log("Starting API test...");
      toast({
        title: "Testing API connection",
        description: "Please wait while we test the connection to FixedFloat API...",
      });

      // Sample request body (can be used to test a real order)
      const sampleRequestBody = {
        fromCcy: "BTC",
        toCcy: "SOL",
        amount: 0.5,
        direction: "from",
        type: "float",
        toAddress: "VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY"
      };
      
      // For a simpler test, we'll use an empty body
      const bodyString = '{}';
      const signature = CryptoJS.HmacSHA256(bodyString, API_CONFIG.FF_API_SECRET).toString();
      console.log("Generated API signature:", signature);
      
      // Sample curl command that works with the API
      const sampleCurlCommand = `curl -X POST \\
  -H "Accept: application/json" \\
  -H "X-API-KEY: bzplvDU0N2Pa5crmQTbqteew6WJyuSGX9BEBPclU" \\
  -H "X-API-SIGN: $(echo -n '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' | openssl dgst -sha256 -hmac \"qIk7Vd6b5M3wqOmD3cnqRGQ6k3dGTDss47fvdng4\" | awk '{print $2}')" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -d '{\"fromCcy\":\"BTC\",\"toCcy\":\"SOL\",\"amount\":0.5,\"direction\":\"from\",\"type\":\"float\",\"toAddress\":\"VrK4yyjXyfPwzTTbf8rhrBcEPDNDvGggHueCSAhqrtY\"}' \\
  "https://ff.io/api/v2/create" -L`;
      
      // Create test debug info for UI display
      const debugInfo = {
        requestDetails: {
          url: "https://ff.io/api/v2/ccies",
          method: "POST",
          requestBody: {},
          requestBodyString: bodyString,
        },
        signatureInfo: {
          signature: signature,
          apiKey: API_CONFIG.FF_API_KEY
        },
        curlCommand: sampleCurlCommand,
        responseDetails: {
          status: "Simulated - No direct API call due to CORS",
          note: "This is a simulated test. To perform a real test, the request needs to be made through the Supabase Edge Function."
        }
      };
      
      setTestDebugInfo(debugInfo);
      
      console.log("Would use API Key:", API_CONFIG.FF_API_KEY);
      console.log("Would use API Signature:", signature);
      console.log("Simulating order status check due to CORS restrictions");
      console.log("API Request would include:", {
        orderId: "TEST-ORDER-ID"
      });
      console.log("API Signature:", signature);
      
      toast({
        title: "API Test Information",
        description: "API signature generated successfully. Test information is displayed below.",
        variant: "default",
      });
    } catch (error) {
      console.error("API test error:", error);
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
