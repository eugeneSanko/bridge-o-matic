
import { Copy, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderDetailsProps {
  orderId: string;
  orderType: string;
  timeRemaining: string | null;
  onCopyClick: () => void;
}

export const OrderDetails = ({ orderId, orderType, timeRemaining, onCopyClick }: OrderDetailsProps) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  };

  return (
    <div className="col-span-4 glass-card p-6 rounded-xl">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Order ID</div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-lg">{orderId.substring(0, 6)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopyClick}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
          <div className="flex items-center gap-2 text-[#0FA0CE]">
            <Clock className="h-5 w-5" />
            <span className="font-medium text-lg">{timeRemaining || "Waiting..."}</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Order Type</div>
          <div className="font-medium">{orderType === 'fixed' ? 'Fixed Flow' : 'Float Rate'}</div>
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
