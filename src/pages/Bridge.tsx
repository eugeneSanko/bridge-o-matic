
import { useBridge } from "@/contexts/BridgeContext";
import { BridgeHeader } from "@/components/bridge/BridgeHeader";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { FAQSection } from "@/components/bridge/FAQSection";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBridgeService } from "@/hooks/useBridgeService";
import { AlertCircle } from "lucide-react";

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
        setApiResponse(`Success! Loaded ${currencies.length} currencies (mock data for development).`);
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
        
        {/* Development Mode Notice */}
        <div className="mb-8 p-4 bg-[#2A2A2A] border border-yellow-600/50 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white text-lg font-medium mb-2">Development Mode</h3>
              <p className="text-gray-300 text-sm mb-2">
                This application is running in development mode with mock data. Direct API calls to FixedFloat are 
                blocked by CORS policy, which is a security feature of web browsers.
              </p>
              <p className="text-gray-300 text-sm mb-2">
                In a production environment, you would need to:
              </p>
              <ol className="list-decimal pl-5 text-gray-300 text-sm space-y-1 mb-3">
                <li>Create a backend proxy service (like a Supabase Edge Function)</li>
                <li>The proxy would make API calls to FixedFloat on behalf of your frontend</li>
                <li>Your frontend would call your proxy instead of calling FixedFloat directly</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* API Test Section */}
        <div className="mb-8 p-4 bg-[#1A1A1A] rounded-xl">
          <h3 className="text-white text-lg font-medium mb-2">API Connection Test</h3>
          <Button 
            onClick={testDirectApiCall} 
            variant="outline"
            className="mb-2"
          >
            Test Mock API Response
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
