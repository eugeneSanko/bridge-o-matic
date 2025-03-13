
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Loader, 
  ArrowLeftRight, 
  SendHorizonal, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  InfoIcon
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApiOrderResponse } from "@/types/bridge";

// Define different statuses available in FixedFloat API
export type BridgeStatus = "NEW" | "PENDING" | "EXCHANGE" | "WITHDRAW" | "DONE" | "EXPIRED" | "EMERGENCY";

interface DebugControlsProps {
  onStatusChange: (status: BridgeStatus, mockApiResponse: any) => void;
  currentStatus: string;
}

export const DebugControls = ({ onStatusChange, currentStatus }: DebugControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to create mock response for each status
  const createMockResponse = (status: BridgeStatus): ApiOrderResponse['data'] => {
    // Base response structure that all statuses will extend
    const baseResponse = {
      id: "ABCD123",
      token: "token123",
      type: "fixed",
      status: status,
      time: {
        reg: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        start: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
        finish: status === "DONE" ? Math.floor(Date.now() / 1000) - 300 : null, // 5 minutes ago if done
        update: Math.floor(Date.now() / 1000),
        expiration: Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
        left: status === "EXPIRED" ? 0 : 1200, // 20 minutes remaining unless expired
      },
      from: {
        code: "BTC",
        coin: "Bitcoin",
        network: "BTC",
        name: "Bitcoin",
        amount: "0.01",
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        reqConfirmations: 2,
        maxConfirmations: 6,
        tx: status !== "NEW" ? {
          id: "9e84b9a53861c25b2fddb127ebb0547b44a976cc5ab8ef61e278a51f51f6f2d1",
          amount: "0.01",
          fee: "0.0001",
          ccyfee: "BTC",
          timeReg: Math.floor(Date.now() / 1000) - 1800,
          timeBlock: Math.floor(Date.now() / 1000) - 1750,
          confirmations: status === "PENDING" ? "1" : "6",
        } : undefined
      },
      to: {
        code: "ETH",
        coin: "Ethereum",
        network: "ETH",
        name: "Ethereum",
        amount: "0.155",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        tx: ["EXCHANGE", "WITHDRAW", "DONE"].includes(status) ? {
          id: "0x1a8b68f7164923932b8ffd13576d191f634d7934e9d210e7caa32a6c5eebad21",
          amount: "0.155",
          fee: "0.002",
          ccyfee: "ETH",
          timeReg: Math.floor(Date.now() / 1000) - 600,
          timeBlock: Math.floor(Date.now() / 1000) - 550,
          confirmations: status === "DONE" ? "30" : "2",
        } : undefined
      }
    };

    // Add status-specific modifications
    switch (status) {
      case "EXPIRED":
        baseResponse.time.expiration = Math.floor(Date.now() / 1000) - 300; // Expired 5 min ago
        baseResponse.time.left = 0;
        break;
      case "EMERGENCY":
        baseResponse.from.tx = {
          ...baseResponse.from.tx as any,
          confirmations: "0", 
          error: "Network congestion"
        };
        break;
    }

    return baseResponse;
  };

  // Define status button configurations
  const statusButtons = [
    { 
      status: "NEW", 
      label: "Awaiting Deposit", 
      icon: Clock, 
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Waiting for user to send funds"
    },
    { 
      status: "PENDING", 
      label: "Pending", 
      icon: Loader, 
      color: "bg-yellow-500 hover:bg-yellow-600",
      description: "Funds received, waiting for confirmations" 
    },
    { 
      status: "EXCHANGE", 
      label: "Exchanging", 
      icon: ArrowLeftRight, 
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Converting currencies"
    },
    { 
      status: "WITHDRAW", 
      label: "Sending", 
      icon: SendHorizonal, 
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Sending funds to destination"
    },
    { 
      status: "DONE", 
      label: "Completed", 
      icon: CheckCircle, 
      color: "bg-green-500 hover:bg-green-600",
      description: "Transaction successfully completed"
    },
    { 
      status: "EXPIRED", 
      label: "Expired", 
      icon: XCircle, 
      color: "bg-red-500 hover:bg-red-600",
      description: "Deposit window expired"
    },
    { 
      status: "EMERGENCY", 
      label: "Emergency", 
      icon: AlertTriangle, 
      color: "bg-red-500 hover:bg-red-600",
      description: "Transaction failed, intervention needed"
    }
  ];

  return (
    <div className="fixed top-16 right-4 z-50 w-80">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="bg-black/90 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center p-3 text-white"
          >
            <div className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              <span>Debug Controls</span>
            </div>
            <div className="px-2 py-1 text-xs bg-gray-700 rounded-full">
              {currentStatus || "N/A"}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            <div className="text-xs text-gray-400 mb-2">
              Set order status for testing. Current: <span className="font-semibold text-white">{currentStatus}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statusButtons.map((btn) => {
                const isActive = currentStatus === btn.status;
                const Icon = btn.icon;
                
                return (
                  <Button
                    key={btn.status}
                    onClick={() => onStatusChange(btn.status as BridgeStatus, createMockResponse(btn.status as BridgeStatus))}
                    className={`${btn.color} ${isActive ? "ring-2 ring-white" : ""} text-white relative group`}
                    title={btn.description}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    <span className="text-xs">{btn.label}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs rounded-md w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {btn.description}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
