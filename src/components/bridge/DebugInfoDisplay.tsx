
import { DebugPanel } from "./DebugPanel";

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
  if (!statusCheckDebugInfo) return null;

  return (
    <div className="mt-8">
      <DebugPanel debugInfo={statusCheckDebugInfo} isLoading={false} />
    </div>
  );
};
