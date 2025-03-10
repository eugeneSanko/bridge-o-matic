
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

export const BridgeTransaction = ({ orderDetails, onCopyAddress }: BridgeTransactionProps) => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <TransactionSummary 
          fromCurrency={orderDetails.fromCurrency}
          toCurrency={orderDetails.toCurrency}
          amount={orderDetails.depositAmount}
          destinationAddress={orderDetails.destinationAddress}
        />

        <div className="grid grid-cols-12 gap-6 mb-12">
          <OrderDetails 
            orderId={orderDetails.ffOrderId || orderDetails.orderId}
            orderType="fixed"
            timeRemaining={orderDetails.timeRemaining}
            onCopyClick={() => onCopyAddress(orderDetails.ffOrderId || orderDetails.orderId)}
            tag={orderDetails.tag}
            tagName={orderDetails.tagName}
          />
          <AddressDetails 
            depositAddress={orderDetails.depositAddress}
            destinationAddress={orderDetails.destinationAddress}
            onCopyClick={() => onCopyAddress(orderDetails.depositAddress)}
            addressAlt={orderDetails.addressAlt}
          />
          <QRCodeSection 
            depositAddress={orderDetails.depositAddress}
            depositAmount={orderDetails.depositAmount}
            fromCurrency={orderDetails.fromCurrency}
            tag={orderDetails.tag}
          />
        </div>

        <ProgressSteps currentStatus={orderDetails.currentStatus} />

        <div className="grid grid-cols-12 gap-6">
          <InformationSection />
          <NotificationSection />
        </div>
      </div>
    </div>
  );
};
