
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AddressDetails } from "./AddressDetails";
import { TransactionSummary } from "./TransactionSummary";
import { Link } from "react-router-dom";

interface OrderDetails {
  orderId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  estimatedReceivedAmount: number;
  depositAddress: string;
  destinationAddress: string;
  orderType: 'fixed' | 'float';
  currentStatus: string;
  createdAt: string;
  expiresAt: string;
}

interface BridgeTransactionProps {
  orderDetails: OrderDetails;
  onCopyAddress: () => void;
}

export const BridgeTransaction = ({ orderDetails, onCopyAddress }: BridgeTransactionProps) => {
  const expiryDate = new Date(orderDetails.expiresAt);
  const now = new Date();
  const timeRemaining = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
  
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;
  
  const formattedTimeRemaining = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-bridge-dark pt-8 sm:pt-16 px-4 sm:px-8 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto animate-slideUp">
        <Link to="/bridge" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Bridge</span>
        </Link>

        <TransactionSummary 
          fromCurrency={orderDetails.fromCurrency}
          toCurrency={orderDetails.toCurrency}
          amount={orderDetails.amount.toString()}
          destinationAddress={orderDetails.destinationAddress}
        />

        <div className="glass-card rounded-xl p-6 sm:p-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-block py-1 px-3 bg-yellow-500/20 rounded-full mb-4">
                <span className="text-xs font-medium text-yellow-400">Awaiting Deposit</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Send Your {orderDetails.fromCurrency}</h2>
              <p className="text-gray-400 text-sm">
                Please send exactly <span className="font-bold text-white">{orderDetails.amount} {orderDetails.fromCurrency}</span> to the address below
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
              <AddressDetails 
                depositAddress={orderDetails.depositAddress}
                destinationAddress={orderDetails.destinationAddress}
                onCopyClick={onCopyAddress}
              />

              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-6 rounded-xl">
                  <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
                  <div className="font-mono text-xl">{formattedTimeRemaining}</div>
                  <div className="mt-2 w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-bridge-accent h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, (timeRemaining / (60 * 60)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <div className="text-sm text-gray-400 mb-2">Order Details</div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Type</span>
                      <span className="text-sm">{orderDetails.orderType === 'fixed' ? 'Fixed Rate' : 'Float Rate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Order ID</span>
                      <span className="text-sm font-mono truncate max-w-[150px]">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm">{new Date(orderDetails.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
