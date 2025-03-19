
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SimulationToggleProps {
  simulateSuccess: boolean;
  setSimulateSuccess: (simulate: boolean) => void;
}

export const SimulationToggle = ({
  simulateSuccess,
  setSimulateSuccess
}: SimulationToggleProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 p-3 rounded-lg flex items-center gap-3">
      <Switch 
        id="simulate-success"
        checked={simulateSuccess}
        onCheckedChange={setSimulateSuccess}
      />
      <Label htmlFor="simulate-success" className="text-sm text-white">
        Simulate Completed
      </Label>
    </div>
  );
};
