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
  const apiStatus =
    orderDetails.rawApiResponse?.status || orderDetails.currentStatus;

  // Extract the time left from the raw API response (in seconds)
  const timeLeft = orderDetails.rawApiResponse?.time?.left || null;

  // Check if order is expired based on various indicators
  const [isExpired, setIsExpired] = useState(false);

  // Check for expired status
  useEffect(() => {
    // Check multiple conditions for expiration
    const isApiExpired = apiStatus === "EXPIRED";
    const isStatusExpired = orderDetails.currentStatus === "expired";
    const isTimerExpired = timeLeft !== null && timeLeft <= 0;
    
    // Only set as expired if the status is NEW or EXPIRED and the timer has expired
    // For other statuses like PENDING, EXCHANGE, etc., we want to continue showing progress
    const shouldMarkAsExpired = (isApiExpired || isStatusExpired) && 
      (apiStatus === "NEW" || apiStatus === "EXPIRED" || 
       orderDetails.currentStatus === "new" || orderDetails.currentStatus === "expired");

    // Log expiration checks for debugging
    console.log("Expiration checks:", {
      apiStatus,
      currentStatus: orderDetails.currentStatus,
      timeLeft,
      isApiExpired,
      isStatusExpired,
      isTimerExpired,
      shouldMarkAsExpired
    });

    // Only set as expired if conditions are met
    if (shouldMarkAsExpired) {
      console.log("Order is expired");
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }
  }, [apiStatus, orderDetails.currentStatus, timeLeft]);

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
  // Keep the original API status if it's not expired - this is important for DONE status
  const displayStatus = isExpired ? "EXPIRED" : apiStatus;

  // Check if the order is complete - explicitly check for both DONE and completed
  const isOrderComplete =
    displayStatus === "DONE" || displayStatus === "completed";

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
          // Use the coin property if available in rawApiResponse
          fromCurrencyCoin={orderDetails.rawApiResponse?.from?.coin || orderDetails.fromCurrency}
          toCurrencyCoin={orderDetails.rawApiResponse?.to?.coin || orderDetails.toCurrency}
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
