
import React, { useEffect, useState } from "react";
import { TransactionSummary } from "./TransactionSummary";
import { OrderDetails } from "./OrderDetails";
import { AddressDetails } from "./AddressDetails";
import { QRCodeSection } from "./QRCodeSection";
import { ProgressSteps } from "./ProgressSteps";
import { InformationSection } from "./InformationSection";
import { NotificationSection } from "./NotificationSection";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";
import { logger } from "@/utils/logger";

interface BridgeTransactionProps {
  orderDetails: OrderDetailsType;
  onCopyAddress: (text: string) => void;
  onRetryCurrentPrice?: () => void;
  onEmergencyExchange?: () => void;
  onEmergencyRefund?: (refundAddress?: string) => void;
}

export const BridgeTransaction = ({
  orderDetails,
  onCopyAddress,
  onRetryCurrentPrice,
  onEmergencyExchange,
  onEmergencyRefund,
}: BridgeTransactionProps) => {
  const apiStatus =
    orderDetails.rawApiResponse?.status || orderDetails.currentStatus;

  // Replace console.log with logger
  logger.debug("API status in BridgeTransaction:", apiStatus);
  logger.debug("Current status in orderDetails:", orderDetails.currentStatus);
  logger.debug("Raw API response status:", orderDetails.rawApiResponse?.status);

  const [isOrderComplete, setIsOrderComplete] = useState(false);

  const timeLeft = orderDetails.rawApiResponse?.time?.left || null;

  const [isExpired, setIsExpired] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    const isApiExpired =
      apiStatus === "EXPIRED" && orderDetails.currentStatus !== "completed";
    const isStatusExpired = orderDetails.currentStatus === "expired";
    const isTimerExpired = timeLeft !== null && timeLeft <= 0;

    logger.debug("Expiration checks:", {
      apiStatus,
      currentStatus: orderDetails.currentStatus,
      timeLeft,
      isApiExpired,
      isStatusExpired,
      isTimerExpired,
    });

    if (orderDetails.currentStatus === "completed") {
      logger.debug("Current status is 'completed', ignoring EXPIRED API status");
      setIsExpired(false);
    } else if (isApiExpired || isStatusExpired || isTimerExpired) {
      logger.debug("Order is expired");
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }

    const isApiEmergency = apiStatus === "EMERGENCY" || apiStatus === "FAILED";
    const isStatusEmergency =
      orderDetails.currentStatus === "emergency" ||
      orderDetails.currentStatus === "failed";

    setIsEmergency(isApiEmergency || isStatusEmergency);
  }, [apiStatus, orderDetails.currentStatus, timeLeft]);

  useEffect(() => {
    const normalizedApiStatus = apiStatus?.toUpperCase();
    const normalizedCurrentStatus = orderDetails.currentStatus?.toLowerCase();

    const isDone =
      normalizedApiStatus === "DONE" ||
      normalizedCurrentStatus === "completed" ||
      normalizedCurrentStatus === "done";

    logger.debug("Checking if order is complete:", {
      normalizedApiStatus,
      normalizedCurrentStatus,
      isDone,
    });

    setIsOrderComplete(isDone);
  }, [apiStatus, orderDetails.currentStatus]);

  React.useEffect(() => {
    if (orderDetails.rawApiResponse) {
      logger.debug("Raw API response:", orderDetails.rawApiResponse);
      if (orderDetails.rawApiResponse.time) {
        logger.debug("Time info:", orderDetails.rawApiResponse.time);
        logger.debug("Time left:", orderDetails.rawApiResponse.time.left);
      }
    }
  }, [orderDetails.rawApiResponse]);

  const displayStatus =
    orderDetails.currentStatus === "completed"
      ? "DONE"
      : isExpired
      ? "EXPIRED"
      : isEmergency
      ? "EMERGENCY"
      : apiStatus;

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-6 md:pt-24 px-3 md:px-8 pb-10 md:pb-24">
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

        <ProgressSteps
          currentStatus={displayStatus}
          orderDetails={orderDetails}
        />

        {!isOrderComplete && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 mb-4 md:mb-12">
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
                onRetryCurrentPrice={onRetryCurrentPrice}
                onEmergencyExchange={onEmergencyExchange}
                onEmergencyRefund={onEmergencyRefund}
                fromCurrency={orderDetails.fromCurrency}
                fromCurrencyName={orderDetails.fromCurrencyName}
              />
              <AddressDetails
                depositAddress={orderDetails.depositAddress}
                destinationAddress={orderDetails.destinationAddress}
                onCopyClick={() => onCopyAddress(orderDetails.depositAddress)}
                addressAlt={orderDetails.addressAlt}
                orderType={orderDetails.orderType}
                fromCurrency={orderDetails.fromCurrency}
                fromCurrencyName={orderDetails.fromCurrencyName}
                currentStatus={displayStatus}
              />

              <QRCodeSection
                depositAddress={orderDetails.depositAddress}
                depositAmount={orderDetails.depositAmount}
                fromCurrency={orderDetails.fromCurrency}
                tag={orderDetails.tag}
                orderId={orderDetails.orderId}
                token={orderDetails.token}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
              <InformationSection />
              <NotificationSection orderDetails={orderDetails} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
