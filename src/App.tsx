
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BridgeProvider } from "@/contexts/BridgeContext";
import Index from "./pages/Index";
import Bridge from "./pages/Bridge";
import BridgeAwaitingDeposit from "./pages/BridgeAwaitingDeposit";
import BridgeOrderComplete from "./pages/BridgeOrderComplete";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BridgeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/bridge/awaiting-deposit" element={<BridgeAwaitingDeposit />} />
            <Route path="/bridge/order-complete" element={<BridgeOrderComplete />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BridgeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
