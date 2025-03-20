
import { toast } from "@/hooks/use-toast";

export const copyToClipboard = (text: string, showToast: boolean = false) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      if (showToast) {
        toast({
          title: "Copied",
          description: "Copied to clipboard",
        });
      }
    })
    .catch((error) => {
      console.error("Failed to copy text:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    });
};
