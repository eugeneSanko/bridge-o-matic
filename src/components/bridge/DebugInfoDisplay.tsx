
import { DebugPanel } from "./DebugPanel";
import { cleanSymbol } from "@/utils/symbolUtils";

interface DebugInfoDisplayProps {
  statusCheckDebugInfo: any | null;
  error: string | null;
  orderDetails: any | null;
}

export const DebugInfoDisplay = ({ 
  statusCheckDebugInfo, 
  error, 
  orderDetails 
}: DebugInfoDisplayProps) => {
  // Don't render anything if no debug info
  if (!statusCheckDebugInfo && !orderDetails) return null;

  // If we have order details, add currency transformation debug info
  let enhancedDebugInfo = statusCheckDebugInfo;
  
  if (orderDetails) {
    const currencyInfo = {
      rawFromCurrency: orderDetails.fromCurrency,
      cleanedFromCurrency: cleanSymbol(orderDetails.fromCurrency),
      rawToCurrency: orderDetails.toCurrency,
      cleanedToCurrency: cleanSymbol(orderDetails.toCurrency),
      fromCurrencyName: orderDetails.fromCurrencyName,
      toCurrencyName: orderDetails.toCurrencyName
    };
    
    // Merge the debug info
    enhancedDebugInfo = {
      ...statusCheckDebugInfo,
      currencyTransformation: currencyInfo
    };
  }

  return (
    <div className="mt-8">
      <DebugPanel debugInfo={enhancedDebugInfo} isLoading={false} />
    </div>
  );
};
