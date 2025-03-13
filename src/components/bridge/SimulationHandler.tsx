
import { useEffect } from "react";
import { OrderDetails } from "@/hooks/useBridgeOrder";
import { SimulationToggle } from "@/components/bridge/SimulationToggle";

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
  // Apply simulated success state if enabled
  useEffect(() => {
    if (!originalOrderDetails) return;
    
    if (simulateSuccess) {
      const simulatedDetails = {
        ...originalOrderDetails,
        currentStatus: "completed",
        rawApiResponse: {
          ...originalOrderDetails.rawApiResponse,
          status: "DONE"
        }
      };
      setOrderDetails(simulatedDetails);
      
      console.log("Simulating DONE state:", {
        originalStatus: originalOrderDetails.currentStatus,
        originalApiStatus: originalOrderDetails.rawApiResponse?.status,
        finalStatus: "completed",
        finalApiStatus: "DONE",
        simulatedDetails
      });
    } else {
      setOrderDetails(originalOrderDetails);
      
      console.log("Using original state:", {
        originalStatus: originalOrderDetails.currentStatus,
        originalApiStatus: originalOrderDetails.rawApiResponse?.status
      });
    }
  }, [originalOrderDetails, simulateSuccess, setOrderDetails]);

  return (
    <SimulationToggle
      simulateSuccess={simulateSuccess}
      setSimulateSuccess={setSimulateSuccess}
    />
  );
};
