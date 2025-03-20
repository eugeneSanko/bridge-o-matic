
import React from "react";

export const LoadingState = () => {
  return (
    <div className="min-h-screen pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0FA0CE] mx-auto mb-4"></div>
        <p className="text-gray-300">Verifying transaction status...</p>
        <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
        <p className="text-gray-500 text-xs mt-4">Checking for completed transactions in our database</p>
      </div>
    </div>
  );
};
