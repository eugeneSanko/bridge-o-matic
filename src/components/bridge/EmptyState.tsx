
import React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  isLoading?: boolean;
}

export const EmptyState = ({ isLoading = false }: EmptyStateProps) => {
  // Don't show "No order details found" during loading
  if (isLoading) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">No transaction details found</p>
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
