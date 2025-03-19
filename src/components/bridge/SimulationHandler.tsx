
// This component has been disabled as requested

import { OrderDetails } from "@/hooks/useBridgeOrder";

interface SimulationHandlerProps {
  simulateSuccess: boolean;
  setSimulateSuccess: (value: boolean) => void;
  originalOrderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails | null) => void;
}

export const SimulationHandler = ({
  simulateSuccess,
  setSimulateSuccess,
  originalOrderDetails,
  setOrderDetails
}: SimulationHandlerProps) => {
  // Component disabled - return nothing
  return null;
};
