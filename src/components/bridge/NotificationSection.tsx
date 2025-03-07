
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const NotificationSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    // Here we would normally send the email to a service for notifications
    // For now we'll just simulate success
    setIsSubscribed(true);
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
              disabled={!email.includes('@')}
            >
              Notify Me
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          <p className="bg-secondary/20 p-3 rounded-lg">
            You will receive email notifications about your transaction status.
          </p>
        </div>
      )}
    </div>
  );
};
