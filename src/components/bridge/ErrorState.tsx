
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="max-w-md w-full glass-card p-8 rounded-xl">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-300 mb-6">{error}</p>
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
