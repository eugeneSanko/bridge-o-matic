import { Button } from "@/components/ui/button";

export const BridgeHeader = () => {
  return (
    <>
      <div className="flex items-center flex-wrap gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Tradenly Bridge
        </h1>
      </div>

      <div className="text-gray-400 mb-8 sm:mb-12 space-y-2">
        <p>The exchange service is provided by Tradenly and FixedFloat.</p>
        <p>
          Creating an order confirms your agreement with the Tradenly and
          FixedFloat rules.
        </p>
      </div>
    </>
  );
};
