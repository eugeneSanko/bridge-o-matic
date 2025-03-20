
import React from "react";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState = ({ 
  message = "Checking transaction status...",
  submessage = "This should only take a moment" 
}: LoadingStateProps) => {
  return (
    <div className="min-h-screen pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0FA0CE] mx-auto mb-4"></div>
        <p className="text-gray-300">{message}</p>
        <p className="text-gray-400 text-sm mt-2">{submessage}</p>
      </div>
    </div>
  );
};
