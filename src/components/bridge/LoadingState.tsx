
import React from "react";

export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0FA0CE] mx-auto mb-4"></div>
        <p className="text-gray-300">Loading order details...</p>
      </div>
    </div>
  );
};
