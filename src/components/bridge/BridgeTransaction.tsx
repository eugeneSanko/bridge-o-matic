
import React from "react";
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
  
  // Log the raw API response for debugging if available
  React.useEffect(() => {
    if (orderDetails.rawApiResponse) {
      console.log("Raw API response:", orderDetails.rawApiResponse);
    }
  }, [orderDetails.rawApiResponse]);

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

        <ProgressSteps currentStatus={apiStatus} />

        <div className="grid grid-cols-12 gap-6 mb-12">
          <OrderDetails
            orderId={orderDetails.orderId}
            orderType={orderDetails.orderType}
            timeRemaining={orderDetails.timeRemaining}
            expiresAt={orderDetails.expiresAt}
            currentStatus={orderDetails.currentStatus}
            onCopyClick={() => onCopyAddress(orderDetails.orderId)}
            tag={orderDetails.tag}
            tagName={orderDetails.tagName}
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
