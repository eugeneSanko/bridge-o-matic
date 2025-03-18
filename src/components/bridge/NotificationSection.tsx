
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { logger } from "@/utils/logger";

interface NotificationSectionProps {
  orderDetails?: {
    orderId: string;
    fromCurrency: string;
    toCurrency: string;
    depositAmount: string;
  };
}

export const NotificationSection = ({ orderDetails }: NotificationSectionProps) => {
  const [searchParams] = useSearchParams();
  const orderId = orderDetails?.orderId || searchParams.get("orderId");
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!orderId || !token) {
      toast({
        title: "Missing Data",
        description: "Order information is not available",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      logger.info(`Setting up email notifications for order ${orderId} to ${email}`);

      // First, register the email with FixedFloat's API
      const { data: ffResponse, error: ffError } = await supabase.functions.invoke(
        "bridge-set-email",
        {
          body: { id: orderId, token, email },
        }
      );

      if (ffError) {
        logger.error("Edge function error when setting email with FF:", ffError);
        throw new Error(`Could not set up email notifications: ${ffError.message}`);
      }

      if (ffResponse.code !== 0) {
        logger.error("API error when setting email with FF:", ffResponse);
        throw new Error(ffResponse.msg || "Could not set up email notifications");
      }

      // Now send our own welcome email with the transaction URL
      if (orderDetails) {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          "bridge-send-email",
          {
            body: {
              email,
              orderId,
              token,
              fromCurrency: orderDetails.fromCurrency,
              toCurrency: orderDetails.toCurrency,
              amount: orderDetails.depositAmount
            },
          }
        );

        if (emailError) {
          logger.error("Error sending welcome email:", emailError);
          // Continue despite error with welcome email - the FF notifications are set up
        } else {
          logger.info("Welcome email sent successfully:", emailResponse);
        }
      }

      setIsSubscribed(true);
      toast({
        title: "Notifications Set",
        description: `You will receive email updates at ${email}`,
        variant: "default",
      });
    } catch (error) {
      logger.error("Error setting email notifications:", error);
      toast({
        title: "Notification Error",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:col-span-4 glass-card p-6 rounded-xl col-span-12">
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
              disabled={!email.includes("@") || isLoading}
            >
              {isLoading ? "Setting up..." : "Notify Me"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          <p className="bg-secondary/20 p-3 rounded-lg flex items-center">
            <span className="mr-2">✓</span>
            You will receive email notifications about your transaction status
            at <span className="font-semibold ml-1">{email}</span>.
          </p>
        </div>
      )}
    </div>
  );
};
