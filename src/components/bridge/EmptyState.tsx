
import React from "react";
import { Button } from "@/components/ui/button";

export const EmptyState = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">No order details found</p>
        <Button 
          className="mt-4 bg-[#0FA0CE] hover:bg-[#0FA0CE]/90"
          onClick={() => window.location.href = "/bridge"}
        >
          Return to Bridge
        </Button>
      </div>
    </div>
  );
};
