
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
      
      // Make direct API call to test endpoint
      const response = await fetch(`${API_CONFIG.FF_API_URL}/ccies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': API_CONFIG.FF_API_KEY,
          'X-API-SIGN': signature
        },
        body: bodyString
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("API test results:", result);

      if (result.code === 0) {
        toast({
          title: "API Test Successful",
          description: "Connection to FixedFloat API is working properly",
          variant: "default",
        });
      } else {
        toast({
          title: "API Test Failed",
          description:
            result.msg || "There was an issue connecting to FixedFloat API",
          variant: "destructive",
        });
      }
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
