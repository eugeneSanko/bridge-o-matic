
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center max-w-md w-full glass-card p-8 rounded-xl">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4">No Order Details Found</h2>
        <p className="text-gray-300 mb-8">
          We couldn't find any details for this order. It may have expired or never existed.
        </p>
        <Button 
          className="w-full bg-[#0FA0CE] hover:bg-[#0FA0CE]/90"
          onClick={() => window.location.href = "/bridge"}
        >
          Return to Bridge
        </Button>
      </div>
    </div>
  );
};
