import { OrderDetails } from "@/components/bridge/OrderDetails";
import { BridgeHeader } from "@/components/bridge/BridgeHeader";
import { ProgressSteps } from "@/components/bridge/ProgressSteps";
import { QrCode } from "@/components/bridge/QrCode";
import { OrderDetails as OrderDetailsType } from "@/hooks/useBridgeOrder";

export interface OrderDetails {
  depositAddress: string;
  depositAmount: string;
  currentStatus: string;
  fromCurrency: string;
  toCurrency: string;
  orderId: string;
  destinationAddress: string;
  expiresAt: string | null;
  timeRemaining: string | null;
  ffOrderId: string;
  ffOrderToken: string;
  tag?: number | null;
  tagName?: string | null;
  addressAlt?: string | null;
  orderType: "fixed" | "float";
  receiveAmount?: string;
  rawApiResponse?: any; // Store raw API response for debugging
}

export function BridgeTransaction({ 
  orderDetails, 
  onCopyAddress,
  onExpiration
}: { 
  orderDetails: OrderDetailsType;
  onCopyAddress: (text: string) => void;
  onExpiration?: () => void;
}) {
  
  return (
    <div className="container max-w-6xl mx-auto px-4 mb-16">
      <div className="mb-6">
        <BridgeHeader />
      </div>
      
      {/* Progress Steps */}
      <ProgressSteps currentStatus={orderDetails.currentStatus} />
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left column - Order Details */}
        <OrderDetails 
          orderId={orderDetails.orderId}
          orderType={orderDetails.orderType}
          timeRemaining={orderDetails.timeRemaining}
          onCopyClick={() => onCopyAddress(orderDetails.orderId)}
          tag={orderDetails.tag}
          tagName={orderDetails.tagName}
          expiresAt={orderDetails.expiresAt}
          currentStatus={orderDetails.currentStatus || orderDetails.rawApiResponse?.status}
          onExpiration={onExpiration}
        />
        
        {/* Right column - QR and Payment Address */}
        <div className="col-span-1 xl:col-span-8 glass-card p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="col-span-1">
              <div className="text-sm text-gray-400 mb-2">Scan QR code to deposit</div>
              <QrCode value={orderDetails.depositAddress} />
            </div>
            
            {/* Payment Address */}
            <div className="col-span-1">
              <div className="text-sm text-gray-400 mb-2">Deposit Address</div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-lg">{orderDetails.depositAddress}</span>
                <button 
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={() => onCopyAddress(orderDetails.depositAddress)}
                >
                  Copy
                </button>
              </div>
              
              {orderDetails.tag && orderDetails.tagName && (
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-2">{orderDetails.tagName}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{orderDetails.tag}</span>
                    <button 
                      className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="button"
                      onClick={() => onCopyAddress(String(orderDetails.tag))}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-2">Deposit Amount</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{orderDetails.depositAmount} {orderDetails.fromCurrency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
