
import React, { useEffect, useState } from "react";
import { TransactionSummary } from "./TransactionSummary";
import { OrderDetails } from "./OrderDetails";
import { AddressDetails } from "./AddressDetails";
import { QRCodeSection } from "./QRCodeSection";
import { ProgressSteps } from "./ProgressSteps";
import { InformationSection } from "./InformationSection";
import { NotificationSection } from "./NotificationSection";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";

interface BridgeTransactionProps {
  orderDetails: OrderDetailsType;
  onCopyAddress: (text: string) => void;
}

export const BridgeTransaction = ({
  orderDetails,
  onCopyAddress,
}: BridgeTransactionProps) => {
  // Extract the original API status if available from the raw response
  const apiStatus = orderDetails.rawApiResponse?.status || orderDetails.currentStatus;
  
  // Add more detailed logging for status tracking
  console.log("API status in BridgeTransaction:", apiStatus);
  console.log("Current status in orderDetails:", orderDetails.currentStatus);
  console.log("Raw API response status:", orderDetails.rawApiResponse?.status);
  
  // Track if status is "DONE" or "completed" (normalized to uppercase for comparison)
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  
  // Extract the time left from the raw API response (in seconds)
  const timeLeft = orderDetails.rawApiResponse?.time?.left || null;

  // Check if order is expired based on various indicators
  const [isExpired, setIsExpired] = useState(false);

  // Check for expired status whenever relevant properties change
  useEffect(() => {
    // Check multiple conditions for expiration
    const isApiExpired = apiStatus === "EXPIRED";
    const isStatusExpired = orderDetails.currentStatus === "expired";
    const isTimerExpired = timeLeft !== null && timeLeft <= 0;

    // Log expiration checks for debugging
    console.log("Expiration checks:", {
      apiStatus,
      currentStatus: orderDetails.currentStatus,
      timeLeft,
      isApiExpired,
      isStatusExpired,
      isTimerExpired,
    });

    // Set as expired if any condition is true
    if (isApiExpired || isStatusExpired || isTimerExpired) {
      console.log("Order is expired");
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }
  }, [apiStatus, orderDetails.currentStatus, timeLeft]);

  // Update the completion status based on the order status
  useEffect(() => {
    // Normalize the status strings for comparison
    const normalizedApiStatus = apiStatus?.toUpperCase();
    const normalizedCurrentStatus = orderDetails.currentStatus?.toLowerCase();
    
    // Check if the order is complete - multiple ways to detect this
    const isDone = 
      normalizedApiStatus === "DONE" || 
      normalizedCurrentStatus === "completed" ||
      normalizedCurrentStatus === "done";
    
    console.log("Checking if order is complete:", {
      normalizedApiStatus,
      normalizedCurrentStatus,
      isDone
    });
    
    setIsOrderComplete(isDone);
  }, [apiStatus, orderDetails.currentStatus]);

  // Log the raw API response for debugging if available
  React.useEffect(() => {
    if (orderDetails.rawApiResponse) {
      console.log("Raw API response:", orderDetails.rawApiResponse);
      if (orderDetails.rawApiResponse.time) {
        console.log("Time info:", orderDetails.rawApiResponse.time);
        console.log("Time left:", orderDetails.rawApiResponse.time.left);
      }
    }
  }, [orderDetails.rawApiResponse]);

  // Use the expired status to update the displayed status
  const displayStatus = isExpired ? "EXPIRED" : apiStatus;
  console.log("Final display status:", displayStatus);
  console.log("Is order complete:", isOrderComplete);

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <TransactionSummary
          fromCurrency={orderDetails.fromCurrency}
          toCurrency={orderDetails.toCurrency}
          amount={orderDetails.depositAmount}
          destinationAddress={orderDetails.destinationAddress}
          receiveAmount={orderDetails.receiveAmount}
          orderType={orderDetails.orderType}
          depositAddress={orderDetails.depositAddress}
          fromCurrencyName={orderDetails.fromCurrencyName}
          toCurrencyName={orderDetails.toCurrencyName}
        />

        {/* Always display ProgressSteps regardless of status */}
        <ProgressSteps
          currentStatus={displayStatus}
          orderDetails={orderDetails}
        />

        {/* Only show these sections if order is not complete */}
        {!isOrderComplete && (
          <>
            <div className="grid grid-cols-12 gap-6 mb-12">
              <OrderDetails
                orderId={orderDetails.orderId}
                orderType={orderDetails.orderType}
                timeRemaining={orderDetails.timeRemaining}
                expiresAt={orderDetails.expiresAt}
                currentStatus={displayStatus}
                onCopyClick={() => onCopyAddress(orderDetails.orderId)}
                tag={orderDetails.tag}
                tagName={orderDetails.tagName}
                timeLeft={timeLeft}
              />
              <AddressDetails
                depositAddress={orderDetails.depositAddress}
                destinationAddress={orderDetails.destinationAddress}
                onCopyClick={() => onCopyAddress(orderDetails.depositAddress)}
                addressAlt={orderDetails.addressAlt}
                orderType={orderDetails.orderType}
                fromCurrency={orderDetails.fromCurrency}
                fromCurrencyName={orderDetails.fromCurrencyName}
              />
              <QRCodeSection
                depositAddress={orderDetails.depositAddress}
                depositAmount={orderDetails.depositAmount}
                fromCurrency={orderDetails.fromCurrency}
                tag={orderDetails.tag}
              />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <InformationSection />
              <NotificationSection />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
