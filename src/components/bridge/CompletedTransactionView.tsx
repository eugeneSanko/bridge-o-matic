
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { Card } from "../ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Star } from "lucide-react";

interface CompletedTransactionViewProps {
  orderDetails: OrderDetails | null;
  onCopyClick?: (text: string) => void;
}

export const CompletedTransactionView = ({
  orderDetails,
  onCopyClick = () => {},
}: CompletedTransactionViewProps) => {
  if (!orderDetails) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 boarder-0">
      {/* Order Details Card (Left) */}
      <Card className="p-6 space-y-4 glass-card">
        <div className="border-b border-white/10 pb-3">
          <div className="text-gray-400 text-sm">Order ID</div>
          <div className="text-[#f0b90b] font-mono font-semibold text-xl flex items-center gap-2">
            {orderDetails?.orderId || "GDBHQ4"}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onCopyClick(orderDetails.orderId)}
            >
              <Copy className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="border-b border-white/10 pb-3">
          <div className="text-gray-400 text-sm">Order status</div>
          <div className="text-green-500 font-medium text-xl">
            Completed
          </div>
        </div>

        <div className="border-b border-white/10 pb-3">
          <div className="text-gray-400 text-sm">Order type</div>
          <div className="text-white text-lg">
            {orderDetails?.orderType === "fixed"
              ? "Fixed rate"
              : "Float rate"}
          </div>
        </div>

        <div className="border-b border-white/10 pb-3">
          <div className="text-gray-400 text-sm">Creation Time</div>
          <div className="text-white text-lg">
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="border-b border-white/10 pb-3">
          <div className="text-gray-400 text-sm">Received Time</div>
          <div className="text-white text-lg">
            {new Date(Date.now() - 5 * 60000).toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-gray-400 text-sm">Completed Time</div>
          <div className="text-white text-lg">
            {new Date().toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Confirmation Card (Right) */}
      <Card className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
        {/* Robot image on the left */}
        <div className="hidden md:block absolute left-0 -bottom-14 opa-50">
          <img
            src="/lovable-uploads/robo.png"
            alt="Robot"
            className="w-40 h-40 md:w-[15rem] md:h-[22rem] lg:w-[22rem] lg:h-[25rem] object-contain "
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 md:pl-48">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 md:justify-items-start">
            Your {orderDetails?.toCurrency || "Ethereum"} was sent
            <Check className="h-6 w-6 text-green-500" />
          </h2>
          <p className="text-gray-300 max-w-md mx-auto md:text-left">
            If you enjoy your experience on FixedFloat, please leave a
            review at services below. We appreciate your support!
          </p>
          <div className="flex gap-6 justify-center mt-4">
            <a
              href="https://www.bestchange.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <div className="bg-[#9EA13F]/20 p-2 rounded">BC</div>
              <span>Bestchange</span>
            </a>
            <a
              href="https://www.trustpilot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Star className="h-5 w-5 text-green-500" />
              <span>Trustpilot</span>
            </a>
          </div>
        </div>
      </Card>

      {/* Transaction Details (Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:col-span-3">
        {/* Accepted Transaction (Left) */}
        <Card className="p-6 border-0 glass-card">
          <h3 className="text-xl font-semibold text-white mb-4">
            Accepted transaction info
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">TxID</span>
              <div className="font-mono text-sm text-white flex items-center gap-2">
                9b942cf8b8e3aa944be74lc462c0c243c7a...
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onCopyClick("9b942cf8b8e3aa944be74lc462c0c243c7a...")}
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">View Receipt</span>
              <a
                className="flex gap-2"
                href={`https://ff.io/order/${
                  orderDetails?.orderId || "GDBHQ4"
                }`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-400" />
              </a>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Received Time</span>
              <span className="text-white">19 hours ago</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Block Time</span>
              <span className="text-white">19 hours ago</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Confirmations</span>
              <span className="text-white">40</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">
                {orderDetails?.depositAmount || "200"}{" "}
                {orderDetails?.fromCurrency || "ADA"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fee</span>
              <span className="text-white">
                0.168845 {orderDetails?.fromCurrency || "ADA"}
              </span>
            </div>
          </div>
        </Card>

        {/* Sent Transaction (Right) */}
        <Card className="p-6 border-0 glass-card">
          <h3 className="text-xl font-semibold text-white mb-4">
            Sent transaction info
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">TxID</span>
              <div className="font-mono text-sm text-white flex items-center gap-2">
                0x7ba710acc700ca056cfabb22e8dda54fa...
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => onCopyClick("0x7ba710acc700ca056cfabb22e8dda54fa...")}
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">View Receipt</span>
              <a
                className="flex gap-2"
                href={`https://ff.io/order/${
                  orderDetails?.orderId || "GDBHQ4"
                }`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-400" />
              </a>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sending time</span>
              <span className="text-white">19 hours ago</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Block Time</span>
              <span className="text-white">19 hours ago</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Confirmations</span>
              <span className="text-white">30</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">
                {orderDetails?.receiveAmount || "0.0541047"}{" "}
                {orderDetails?.toCurrency || "ETH"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fee</span>
              <span className="text-white">
                0 {orderDetails?.toCurrency || "ETH"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
