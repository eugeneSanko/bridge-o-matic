
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
  
  // Extract the time left from the raw API response (in seconds)
  const timeLeft = orderDetails.rawApiResponse?.time?.left || null;
  
  // Check if order is expired based on time left
  const [isExpired, setIsExpired] = useState(false);
  
  // Check for expired status
  useEffect(() => {
    // Check if the API status is already EXPIRED
    if (apiStatus === "EXPIRED" || orderDetails.currentStatus === "expired") {
      setIsExpired(true);
      return;
    }
    
    // Check if the timer has run out (timeLeft is 0 or negative)
    if (timeLeft !== null && timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    
    setIsExpired(false);
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
  const displayStatus = isExpired ? "EXPIRED" : apiStatus;

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
        />

        <ProgressSteps currentStatus={displayStatus} />

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
      </div>
    </div>
  );
};
