
import React, { useEffect, useState } from "react";
import { TransactionSummary } from "./TransactionSummary";
import { OrderDetails } from "./OrderDetails";
import { AddressDetails } from "./AddressDetails";
import { QRCodeSection } from "./QRCodeSection";
import { SuccessPage } from "./ProgressSteps";
import { InformationSection } from "./InformationSection";
import { NotificationSection } from "./NotificationSection";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";
import { ProgressBar } from "./ProgressBar";

interface BridgeTransactionProps {
  orderDetails: OrderDetailsType;
  onCopyAddress: (text: string) => void;
}

export const BridgeTransaction = ({
  orderDetails,
  onCopyAddress,
}: BridgeTransactionProps) => {
  // Extract the original API status directly from the raw response or currentStatus
  // This ensures we pass the original case (uppercase) status to ProgressSteps
  const apiStatus =
    orderDetails.rawApiResponse?.status || orderDetails.currentStatus;

  // Extract the time left from the raw API response (in seconds)
  const timeLeft = orderDetails.rawApiResponse?.time?.left || null;

  // For debug purposes
  useEffect(() => {
    console.log("BridgeTransaction rendering with status:", {
      apiStatus,
      currentStatus: orderDetails.currentStatus,
      rawStatus: orderDetails.rawApiResponse?.status,
      timeLeft
    });
  }, [apiStatus, orderDetails, timeLeft]);

  // Check if the order is complete - explicitly check for both DONE and completed
  const isOrderComplete =
    apiStatus === "DONE" || apiStatus?.toLowerCase() === "completed";

  // Ensure we have valid strings for currency information
  const fromCurrency = orderDetails.fromCurrency || "";
  const toCurrency = orderDetails.toCurrency || "";
  const fromCurrencyCoin =
    orderDetails.rawApiResponse?.from?.coin || fromCurrency || "";
  const toCurrencyCoin =
    orderDetails.rawApiResponse?.to?.coin || toCurrency || "";

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 px-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <TransactionSummary
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          amount={orderDetails.depositAmount || "0"}
          destinationAddress={orderDetails.destinationAddress || ""}
          receiveAmount={orderDetails.receiveAmount}
          orderType={orderDetails.orderType}
          depositAddress={orderDetails.depositAddress}
          fromCurrencyName={orderDetails.fromCurrencyName}
          toCurrencyName={orderDetails.toCurrencyName}
          // Use the coin property if available in rawApiResponse
          fromCurrencyCoin={fromCurrencyCoin}
          toCurrencyCoin={toCurrencyCoin}
        />

        {/* Progress Bar with direct API status and live time remaining */}
        <ProgressBar 
          currentStatus={apiStatus} 
          timeRemaining={orderDetails.timeRemaining}
        />

        {/* Always display ProgressSteps with the original status case */}
        <SuccessPage
          currentStatus={apiStatus || ""}
          orderDetails={orderDetails}
          key={`progress-${apiStatus}`} // Force re-render when status changes
        />

        {/* Only show these sections if order is not complete */}
        {!isOrderComplete && (
          <>
            <div className="grid grid-cols-12 gap-6 mb-12">
              <OrderDetails
                orderId={orderDetails.orderId || ""}
                orderType={orderDetails.orderType}
                timeRemaining={orderDetails.timeRemaining}
                expiresAt={orderDetails.expiresAt}
                currentStatus={apiStatus || ""}
                onCopyClick={() => onCopyAddress(orderDetails.orderId || "")}
                tag={orderDetails.tag}
                tagName={orderDetails.tagName}
                timeLeft={timeLeft}
              />
              <AddressDetails
                depositAddress={orderDetails.depositAddress || ""}
                destinationAddress={orderDetails.destinationAddress || ""}
                onCopyClick={() =>
                  onCopyAddress(orderDetails.depositAddress || "")
                }
                addressAlt={orderDetails.addressAlt}
                orderType={orderDetails.orderType}
                fromCurrency={fromCurrency}
                fromCurrencyName={orderDetails.fromCurrencyName}
              />
              <QRCodeSection
                depositAddress={orderDetails.depositAddress || ""}
                depositAmount={orderDetails.depositAmount || "0"}
                fromCurrency={fromCurrency}
                tag={orderDetails.tag}
              />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <InformationSection />
              <NotificationSection />
            </div>
          </>
        )}

        {/* Show success message if order is complete */}
        {isOrderComplete && (
          <div className="mt-8 p-6 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-2">
              Transaction Complete!
            </h3>
            <p className="text-green-200">
              Your funds have been successfully transferred. They should appear
              in your destination wallet shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
