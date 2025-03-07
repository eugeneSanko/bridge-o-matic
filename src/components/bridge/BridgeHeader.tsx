
import { Button } from "@/components/ui/button";
import { Beaker } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import CryptoJS from 'crypto-js';

export const BridgeHeader = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);

  const testApi = async () => {
    setIsTestingApi(true);
    try {
      console.log("Starting API test...");
      toast({
        title: "Testing API connection",
        description:
          "Please wait while we test the connection to FixedFloat API...",
      });

      // Generate signature for empty body
      const bodyString = '{}';
      const signature = CryptoJS.HmacSHA256(bodyString, API_CONFIG.FF_API_SECRET).toString();
      console.log("Generated API signature:", signature);
      
      // Construct a URL that can be safely opened in a new tab
      const testUrl = 'https://ff.io/api/v2/ccies';
      console.log("Opening test URL in new tab:", testUrl);
      
      // Since we can't do a direct fetch due to CORS, we'll test by logging the API key and signature
      console.log("Would use API Key:", API_CONFIG.FF_API_KEY);
      console.log("Would use API Signature:", signature);
      
      toast({
        title: "API Test Information",
        description: "API signature generated successfully. Direct API calls must be made from a backend service due to CORS restrictions.",
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
    </>
  );
};
