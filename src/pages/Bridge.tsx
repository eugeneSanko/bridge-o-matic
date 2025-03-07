import { useBridge } from "@/contexts/BridgeContext";
import { BridgeHeader } from "@/components/bridge/BridgeHeader";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { FAQSection } from "@/components/bridge/FAQSection";
import { DebugPanel } from "@/components/bridge/DebugPanel";

const Bridge = () => {
  const { availableCurrencies, isLoadingCurrencies } = useBridge();

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-16 sm:pt-24 px-4 sm:px-8 pb-16 sm:pb-24">
      <div className="max-w-3xl mx-auto">
        <BridgeHeader />
        <BridgeForm />
        <FAQSection />

        {/* Debug Panel Component */}
        <DebugPanel
          availableCurrencies={availableCurrencies}
          isLoadingCurrencies={isLoadingCurrencies}
        />
      </div>
    </div>
  );
};

export default Bridge;
