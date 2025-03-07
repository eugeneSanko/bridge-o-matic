
import { useBridge } from "@/contexts/BridgeContext";
import { BridgeProvider } from "@/contexts/BridgeContext";
import { BridgeHeader } from "@/components/bridge/BridgeHeader";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { FAQSection } from "@/components/bridge/FAQSection";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBridgeService } from "@/hooks/useBridgeService";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BridgeContent = () => {
  const { isLoadingCurrencies, availableCurrencies, refreshCurrencies } = useBridge();
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      console.log("Currency data:", JSON.stringify(availableCurrencies, null, 2));
    }
  }, [availableCurrencies]);

  const testDirectApiCall = async () => {
    console.log("Testing direct API call to FixedFloat via edge function...");
    setIsLoading(true);
    setApiResponse(null);
    
    try {
      // Call the Supabase edge function directly to get the raw response
      const { data, error } = await supabase.functions.invoke('bridge-currencies');
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      // Display the full raw response
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("API test failed:", error);
      setApiResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-16 sm:pt-24 px-4 sm:px-8 pb-16 sm:pb-24">
      <div className="max-w-3xl mx-auto">
        <BridgeHeader />
        
        {/* API Test Section */}
        <div className="mb-8 p-4 bg-[#1A1A1A] rounded-xl">
          <h3 className="text-white text-lg font-medium mb-2">FixedFloat API Response</h3>
          <p className="text-gray-400 text-sm mb-3">
            View the direct response from the FixedFloat API currencies endpoint.
          </p>
          <Button 
            onClick={testDirectApiCall} 
            variant="outline"
            className="mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Show FixedFloat API Response'
            )}
          </Button>
          
          {apiResponse && (
            <div className="mt-2 p-3 bg-[#111] rounded text-sm text-white overflow-auto max-h-[500px]">
              <pre className="whitespace-pre-wrap">{apiResponse}</pre>
            </div>
          )}
        </div>
        
        <BridgeForm />
        <FAQSection />
      </div>
    </div>
  );
};

// Wrap the component with BridgeProvider to fix the "useBridge must be used within a BridgeProvider" error
const Bridge = () => {
  return (
    <BridgeProvider>
      <BridgeContent />
    </BridgeProvider>
  );
};

export default Bridge;
