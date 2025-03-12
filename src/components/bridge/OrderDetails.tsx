
import { useState, useEffect } from "react";
import { Copy, Clock, Calendar, Tag, AlertCircle, TimerOff } from "lucide-react";
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
  timeLeft?: number | null;
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
  timeLeft
}: OrderDetailsProps) => {
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining || "20:00");
  const [timerColor, setTimerColor] = useState("#9b87f5"); // Start with purple
  const [isExpired, setIsExpired] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  
  // Initialize the timer based on timeLeft from API
  useEffect(() => {
    if (timeLeft !== undefined && timeLeft !== null) {
      console.log(`Initializing timer with API timeLeft value: ${timeLeft} seconds`);
      setSecondsRemaining(timeLeft);
    }
  }, [timeLeft]);
  
  // Countdown effect
  useEffect(() => {
    // Only start countdown if we have secondsRemaining value
    if (secondsRemaining === null) return;
    
    // Format and display the time
    const updateTimerDisplay = () => {
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = Math.floor(secondsRemaining % 60);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setLocalTimeRemaining(formattedTime);
      
      // Update colors based on time remaining
      if (secondsRemaining <= 0) {
        setTimerColor("#ea384c"); // Red when expired
        setIsExpired(true);
        return;
      } else if (minutes <= 5) {
        setTimerColor("#ea384c"); // Red when less than 5 minutes
      } else if (minutes <= 10) {
        setTimerColor("#F97316"); // Orange when less than 10 minutes
      } else {
        setTimerColor("#9b87f5"); // Purple otherwise
      }
    };
    
    // Initial update
    updateTimerDisplay();
    
    // Set up interval to update every second
    const intervalId = setInterval(() => {
      setSecondsRemaining(prev => {
        const newValue = prev !== null ? prev - 1 : 0;
        return Math.max(0, newValue); // Don't go below zero
      });
      updateTimerDisplay();
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [secondsRemaining]);

  // Fallback to expiresAt if no timeLeft provided
  useEffect(() => {
    if (secondsRemaining !== null) return; // Skip if we already have seconds remaining
    
    if (expiresAt) {
      // Calculate seconds remaining based on expiresAt
      const endTime = new Date(expiresAt);
      const now = new Date();
      const diffSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      setSecondsRemaining(diffSeconds);
    } else if (timeRemaining) {
      // Parse from timeRemaining (MM:SS format)
      const [minutes, seconds] = timeRemaining.split(':').map(Number);
      setSecondsRemaining((minutes * 60) + seconds);
    } else {
      // Default to 20 minutes if no time info provided
      setSecondsRemaining(20 * 60);
    }
  }, [expiresAt, timeRemaining, secondsRemaining]);

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
            {isExpired ? (
              <TimerOff className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5 animate-pulse" />
            )}
            <span className="font-medium text-lg transition-colors duration-300">
              {isExpired ? "Expired" : localTimeRemaining || "Waiting..."}
            </span>
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
