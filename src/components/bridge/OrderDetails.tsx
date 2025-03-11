
import { Copy, Clock, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderDetailsProps {
  orderId: string;
  orderType: "fixed" | "float";
  timeRemaining: string | null;
  onCopyClick: () => void;
  tag?: number | null;
  tagName?: string | null;
}

export const OrderDetails = ({ orderId, orderType, timeRemaining, onCopyClick, tag, tagName }: OrderDetailsProps) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  };

  return (
    <div className="col-span-4 glass-card p-6 rounded-xl">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Order ID</div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-lg">{orderId}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopyClick}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {tag && tagName && (
          <div>
            <div className="text-sm text-gray-400 mb-2">{tagName}</div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#0FA0CE]" />
              <span className="font-mono font-medium">{tag}</span>
            </div>
          </div>
        )}
        
        <div>
          <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
          <div className="flex items-center gap-2 text-[#0FA0CE]">
            <Clock className="h-5 w-5 animate-pulse" />
            <span className="font-medium text-lg">{timeRemaining || "Waiting..."}</span>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-2">Order Type</div>
          <div className="font-medium capitalize">
            {orderType === 'fixed' ? 'Fixed Flow (1% fee)' : 'Float Rate (0.5% fee)'}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-2">Created</div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(new Date())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
