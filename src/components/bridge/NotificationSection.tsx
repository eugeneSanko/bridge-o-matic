
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

export const NotificationSection = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token") || "";
  
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    if (!orderId || !token) {
      toast({
        title: "Missing Data",
        description: "Order information is not available",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Setting up email notifications for order ${orderId} to ${email}`);
      
      const { data, error } = await supabase.functions.invoke('bridge-set-email', {
        body: { id: orderId, token, email }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        setIsLoading(false);
        setDebugInfo(error);
        
        toast({
          title: "Notification Error",
          description: `Could not set up email notifications: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log("Email notification response:", data);
      
      if (data.debugInfo) {
        setDebugInfo(data.debugInfo);
      }
      
      if (data.code === 0) {
        setIsSubscribed(true);
        toast({
          title: "Notifications Set",
          description: `You will receive email updates at ${email}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Notification Error",
          description: data.msg || "Could not set up email notifications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error setting email notifications:", error);
      toast({
        title: "Notification Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="col-span-4 glass-card p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-[#0FA0CE]" />
        <h3 className="text-lg font-medium">Notifications</h3>
      </div>
      
      {!isSubscribed ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Get email updates about your transaction status.
          </p>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/30"
            />
            <Button 
              onClick={handleSubscribe}
              className="w-full bg-[#0FA0CE] hover:bg-[#0FA0CE]/90"
              disabled={!email.includes('@') || isLoading}
            >
              {isLoading ? "Setting up..." : "Notify Me"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          <p className="bg-secondary/20 p-3 rounded-lg">
            You will receive email notifications about your transaction status at <span className="font-semibold">{email}</span>.
          </p>
        </div>
      )}
    </div>
  );
};
