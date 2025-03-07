
import { useBridge } from "@/contexts/BridgeContext";
import { BridgeHeader } from "@/components/bridge/BridgeHeader";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { FAQSection } from "@/components/bridge/FAQSection";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBridgeService } from "@/hooks/useBridgeService";

const Bridge = () => {
  const { isLoadingCurrencies, availableCurrencies, refreshCurrencies } = useBridge();
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const bridgeService = useBridgeService();

  useEffect(() => {
    // Fetch currencies when the component mounts
    refreshCurrencies();
    console.log("Bridge component mounted, fetching currencies...");
  }, [refreshCurrencies]);

  useEffect(() => {
    // Log currencies when they're loaded
    if (availableCurrencies.length > 0) {
      console.log("Currencies loaded:", availableCurrencies.length);
    }
  }, [availableCurrencies]);

  const testDirectApiCall = async () => {
    console.log("Testing direct API call to FixedFloat...");
    try {
      const currencies = await bridgeService.fetchCurrencies();
      
      if (currencies && currencies.length > 0) {
        setApiResponse(`Success! Loaded ${currencies.length} currencies.`);
      } else {
        setApiResponse("API request succeeded but no currencies were returned.");
      }
    } catch (error) {
      console.error("Direct API test failed:", error);
      setApiResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-16 sm:pt-24 px-4 sm:px-8 pb-16 sm:pb-24">
      <div className="max-w-3xl mx-auto">
        <BridgeHeader />
        
        {/* API Test Section */}
        <div className="mb-8 p-4 bg-[#1A1A1A] rounded-xl">
          <h3 className="text-white text-lg font-medium mb-2">API Connection Test</h3>
          <Button 
            onClick={testDirectApiCall} 
            variant="outline"
            className="mb-2"
          >
            Test Direct API Call
          </Button>
          
          {apiResponse && (
            <div className="mt-2 p-3 bg-[#111] rounded text-sm text-white">
              <p>{apiResponse}</p>
            </div>
          )}
        </div>
        
        <BridgeForm />
        <FAQSection />
      </div>
    </div>
  );
};

export default Bridge;
