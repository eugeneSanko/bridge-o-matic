
import { useState, useEffect } from "react";
import { Copy, Clock, Calendar, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderDetailsProps {
  orderId: string;
  orderType: "fixed" | "float";
  timeRemaining: string | null;
  onCopyClick: () => void;
  tag?: number | null;
  tagName?: string | null;
  expiresAt?: string | null;
  currentStatus?: string;
  onExpiration?: () => void;
}

export const OrderDetails = ({ 
  orderId, 
  orderType, 
  timeRemaining, 
  onCopyClick, 
  tag, 
  tagName,
  expiresAt,
  currentStatus = "NEW",
  onExpiration
}: OrderDetailsProps) => {
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining || "20:00");
  const [timerColor, setTimerColor] = useState("#9b87f5"); // Start with purple
  const [isExpired, setIsExpired] = useState(false);
  
  // Calculate and update countdown timer
  useEffect(() => {
    if (!expiresAt && !timeRemaining) {
      // Start with 20 minutes if no expiration time provided
      const endTime = new Date(Date.now() + 20 * 60000);
      
      const intervalId = setInterval(() => {
        const now = new Date();
        const diffMs = endTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          clearInterval(intervalId);
          setLocalTimeRemaining("0:00");
          setTimerColor("#ea384c");
          setIsExpired(true);
          if (onExpiration) onExpiration();
          return;
        }
        
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);
        const newTimeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        
        // Change color based on remaining time
        if (diffMinutes <= 5) {
          setTimerColor("#ea384c"); // Red when less than 5 minutes
        } else if (diffMinutes <= 10) {
          setTimerColor("#F97316"); // Orange when less than 10 minutes
        } else {
          setTimerColor("#9b87f5"); // Purple otherwise
        }
        
        setLocalTimeRemaining(newTimeRemaining);
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else if (expiresAt) {
      // Use provided expiration time
      const endTime = new Date(expiresAt);
      
      const intervalId = setInterval(() => {
        const now = new Date();
        const diffMs = endTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          clearInterval(intervalId);
          setLocalTimeRemaining("0:00");
          setTimerColor("#ea384c");
          setIsExpired(true);
          if (onExpiration) onExpiration();
          return;
        }
        
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);
        const newTimeRemaining = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        
        // Change color based on remaining time
        if (diffMinutes <= 5) {
          setTimerColor("#ea384c"); // Red when less than 5 minutes
        } else if (diffMinutes <= 10) {
          setTimerColor("#F97316"); // Orange when less than 10 minutes
        } else {
          setTimerColor("#9b87f5"); // Purple otherwise (for 20-10 mins)
        }
        
        setLocalTimeRemaining(newTimeRemaining);
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [expiresAt, timeRemaining, onExpiration]);

  // Check if status is already expired or failed
  useEffect(() => {
    if (currentStatus === "EXPIRED" || 
        currentStatus === "expired" || 
        currentStatus === "FAILED" || 
        currentStatus === "failed" ||
        currentStatus === "EMERGENCY") {
      setIsExpired(true);
      setTimerColor("#ea384c");
    }
  }, [currentStatus]);

  const formatDate = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  };

  const renderStatusSection = () => {
    // Check for failed or expired status in API format or app format
    const hasFailedOrExpired = isExpired || 
      currentStatus === "FAILED" || 
      currentStatus === "EXPIRED" ||
      currentStatus === "failed" || 
      currentStatus === "expired" ||
      currentStatus === "EMERGENCY";
    
    if (hasFailedOrExpired) {
      return (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">
              {isExpired || currentStatus === "EXPIRED" || currentStatus === "expired" 
                ? "Deposit window expired" 
                : "Awaiting deposit failed"}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Please contact support with your order ID
          </p>
        </div>
      );
    }
    
    return null;
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
              <Tag className="h-4 w-4 text-[#9b87f5]" />
              <span className="font-mono font-medium">{tag}</span>
            </div>
          </div>
        )}
        
        <div>
          <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
          <div className="flex items-center gap-2" style={{ color: timerColor }}>
            <Clock className="h-5 w-5 animate-pulse" />
            <span className="font-medium text-lg transition-colors duration-300">{localTimeRemaining || "Waiting..."}</span>
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
        
        {renderStatusSection()}
      </div>
    </div>
  );
};
