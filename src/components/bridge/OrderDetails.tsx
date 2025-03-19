
import { useState, useEffect } from "react";
import {
  Copy,
  Clock,
  Calendar,
  Tag,
  AlertCircle,
  TimerOff,
  RefreshCw,
  ArrowRight,
  LifeBuoy,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  onRetryCurrentPrice?: () => void;
  onEmergencyExchange?: () => void;
  onEmergencyRefund?: (refundAddress?: string) => void;
  fromCurrency?: string;
  fromCurrencyName?: string;
  network?: string; // Add network prop for explorer links
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
  timeLeft,
  onRetryCurrentPrice,
  onEmergencyExchange,
  onEmergencyRefund,
  fromCurrency = "",
  fromCurrencyName = "",
}: OrderDetailsProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localTimeRemaining, setLocalTimeRemaining] = useState(
    timeRemaining || "20:00"
  );
  const [timerColor, setTimerColor] = useState("#9b87f5"); // Start with purple
  const [isExpired, setIsExpired] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showFundsSentAlert, setShowFundsSentAlert] = useState(false);
  const [showWaitingMessage, setShowWaitingMessage] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState<"EXCHANGE" | "REFUND">(
    "EXCHANGE"
  );
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"EXCHANGE" | "REFUND" | null>(null);
  const [apiResponseOk, setApiResponseOk] = useState(false);
  const [refundAddress, setRefundAddress] = useState("");

  // Initialize the timer based on timeLeft from API
  useEffect(() => {
    if (timeLeft !== undefined && timeLeft !== null) {
      console.log(
        `Initializing timer with API timeLeft value: ${timeLeft} seconds`
      );
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
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
      setSecondsRemaining((prev) => {
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
      const diffSeconds = Math.max(
        0,
        Math.floor((endTime.getTime() - now.getTime()) / 1000)
      );
      setSecondsRemaining(diffSeconds);
    } else if (timeRemaining) {
      // Parse from timeRemaining (MM:SS format)
      const [minutes, seconds] = timeRemaining.split(":").map(Number);
      setSecondsRemaining(minutes * 60 + seconds);
    } else {
      // Default to 20 minutes if no time info provided
      setSecondsRemaining(20 * 60);
    }
  }, [expiresAt, timeRemaining, secondsRemaining]);

  // Check if API response was successful
  useEffect(() => {
    if (choiceMade && selectedAction) {
      setApiResponseOk(true);
    }
  }, [choiceMade, selectedAction]);

  const formatDate = (date: Date) => {
    return date.toISOString().replace("T", " ").substring(0, 16) + " UTC";
  };

  const handleNewExchange = () => {
    navigate("/bridge");
  };

  const handleSentFunds = () => {
    setShowFundsSentAlert(true);
  };

  const handleEmergencyAction = () => {
    if (emergencyAction === "EXCHANGE" && onEmergencyExchange) {
      onEmergencyExchange();
      setChoiceMade(true);
      setSelectedAction("EXCHANGE");
      setShowWaitingMessage(true);
    } else if (emergencyAction === "REFUND" && onEmergencyRefund) {
      if (onEmergencyRefund) {
        onEmergencyRefund(refundAddress);
        setChoiceMade(true);
        setSelectedAction("REFUND");
        setShowWaitingMessage(true);
        
        // Add refund parameter to the URL when refund is selected and confirmed
        const currentParams = Object.fromEntries(searchParams.entries());
        setSearchParams({
          ...currentParams,
          refund: 'true',
          refundCurrency: fromCurrency || ''
        });
      }
    }
  };

  const renderStatusSection = () => {
    // Check for expired status
    const isStatusExpired =
      isExpired || currentStatus === "EXPIRED" || currentStatus === "expired";

    // Check for emergency status
    const isEmergency =
      currentStatus === "FAILED" ||
      currentStatus === "EMERGENCY" ||
      currentStatus === "emergency" ||
      currentStatus === "failed";

    if (isEmergency) {
      return (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Exchange emergency</span>
          </div>
          
          {showWaitingMessage ? (
            <Alert className="mt-3 mb-3 bg-blue-500/10 border-blue-500/20 text-blue-400">
              <AlertTitle className="text-blue-300 font-medium">Transaction Status</AlertTitle>
              <AlertDescription className="text-blue-200">
                Waiting for the appearance of the transaction on the blockchain network. Funds have not yet arrived at the address indicated in the order. We will exchange funds after the receipt of the transaction and the receipt of the required number of confirmations of the blockchain network.
              </AlertDescription>
            </Alert>
          ) : (
            choiceMade && apiResponseOk ? (
              <Alert className="mt-3 mb-3 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <AlertTitle className="text-green-300 font-medium">
                    {selectedAction === "EXCHANGE" 
                      ? "Exchange request submitted" 
                      : "Refund request submitted"}
                  </AlertTitle>
                </div>
                <AlertDescription className="text-green-200 mt-1">
                  {selectedAction === "EXCHANGE"
                    ? "Your transaction will be processed at the current market rate. We'll notify you when it's complete."
                    : `Your refund request has been submitted to address ${refundAddress}. Funds will be returned minus network fees.`}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-2">
                  Your exchange encountered an issue. Choose an option:
                </p>

                <div className="mt-3">
                  <RadioGroup
                    value={emergencyAction}
                    onValueChange={(value) =>
                      setEmergencyAction(value as "EXCHANGE" | "REFUND")
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="EXCHANGE" id="emergency-exchange" />
                      <Label htmlFor="emergency-exchange">
                        Continue exchange at market rate
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="REFUND" id="emergency-refund" />
                      <Label htmlFor="emergency-refund">
                        Request refund minus fees
                      </Label>
                    </div>
                  </RadioGroup>

                  {emergencyAction === "REFUND" && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-300 mb-2">
                        {fromCurrencyName || "Original"} Refund Address
                        <span className="ml-1 text-xs text-gray-400">
                          (Enter your {fromCurrency || "sending token"} address)
                        </span>
                      </label>
                      <Input
                        value={refundAddress}
                        onChange={(e) => setRefundAddress(e.target.value)}
                        placeholder={`Enter your ${fromCurrency || "sending token"} address for refund`}
                        className="mb-2"
                      />
                      <div className="text-xs text-gray-400 mb-3">
                        This must be an address that can receive {fromCurrencyName || "the original token"} you sent
                      </div>
                    </div>
                  )}

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full mt-3"
                    onClick={handleEmergencyAction}
                    disabled={emergencyAction === "REFUND" && !refundAddress.trim()}
                  >
                    Confirm
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      );
    }

    if (isStatusExpired) {
      return (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <TimerOff className="h-5 w-5" />
            <span className="font-medium">Deposit window expired</span>
          </div>

          {showWaitingMessage ? (
            <Alert className="mt-3 mb-3 bg-blue-500/10 border-blue-500/20 text-blue-400">
              <AlertTitle className="text-blue-300 font-medium">Transaction Status</AlertTitle>
              <AlertDescription className="text-blue-200">
                Waiting for the appearance of the transaction on the blockchain network. Funds have not yet arrived at the address indicated in the order. We will exchange funds after the receipt of the transaction and the receipt of the required number of confirmations of the blockchain network.
              </AlertDescription>
            </Alert>
          ) : (
            choiceMade && apiResponseOk ? (
              <Alert className="mt-3 mb-3 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <AlertTitle className="text-green-300 font-medium">
                    {selectedAction === "EXCHANGE" 
                      ? "Exchange request submitted" 
                      : "Refund request submitted"}
                  </AlertTitle>
                </div>
                <AlertDescription className="text-green-200 mt-1">
                  {selectedAction === "EXCHANGE"
                    ? "Your transaction will be processed at the current market rate. We'll notify you when it's complete."
                    : `Your refund request has been submitted to address ${refundAddress}. Funds will be returned minus network fees.`}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex gap-2 mt-3 flex-col">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={handleNewExchange}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Create New Exchange
                  </Button>
                  {!showFundsSentAlert && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full glass-card"
                      onClick={handleSentFunds}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />I sent funds already
                    </Button>
                  )}
                </div>

                {showFundsSentAlert && (
                  <Alert variant="destructive" className="mt-3 mb-3">
                    <span className="space-x-1 flex ">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>I sent funds, but my order has expired</AlertTitle>
                    </span>

                    <AlertDescription className="text-muted-foreground">
                      Choose one of the following options:
                    </AlertDescription>

                    <div className="mt-4">
                      <RadioGroup
                        value={emergencyAction}
                        onValueChange={(value) =>
                          setEmergencyAction(value as "EXCHANGE" | "REFUND")
                        }
                        className="space-y-2 text-white"
                      >
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="EXCHANGE" id="exchange" />
                          <Label htmlFor="exchange">
                            Continue my exchange (at market rate)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="REFUND" id="refund" />
                          <Label htmlFor="refund">
                            Make a refund minus network fee
                          </Label>
                        </div>
                      </RadioGroup>

                      {emergencyAction === "REFUND" && (
                        <div className="mt-3">
                          <label className="block text-sm text-gray-300 mb-2">
                            {fromCurrencyName || "Original"} Refund Address
                            <span className="ml-1 text-xs text-gray-400">
                              (Enter your {fromCurrency || "sending token"} address)
                            </span>
                          </label>
                          <Input
                            value={refundAddress}
                            onChange={(e) => setRefundAddress(e.target.value)}
                            placeholder={`Enter your ${fromCurrency || "sending token"} address for refund`}
                            className="mb-2"
                          />
                          <div className="text-xs text-gray-400 mb-3">
                            This must be an address that can receive {fromCurrencyName || "the original token"} you sent
                          </div>
                        </div>
                      )}

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full mt-3"
                        onClick={handleEmergencyAction}
                        disabled={emergencyAction === "REFUND" && !refundAddress.trim()}
                      >
                        Confirm
                      </Button>
                    </div>
                  </Alert>
                )}
              </>
            )
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="col-span-5 glass-card p-6 rounded-xl">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Order ID</div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-lg">{orderId}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCopyClick}
            >
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
          <div
            className="flex items-center gap-2"
            style={{ color: timerColor }}
          >
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

        {renderStatusSection()}

        <div>
          <div className="text-sm text-gray-400 mb-2">Order Type</div>
          <div className="font-medium capitalize">
            {orderType === "fixed"
              ? "Fixed Flow (1% fee)"
              : "Float Rate (0.5% fee)"}
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
