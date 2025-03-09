
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DebugSectionProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  copyData?: string;
  copyLabel?: string;
  variant?: "default" | "error";
}

export const DebugSection = ({
  title,
  titleColor = "#0FA0CE",
  children,
  copyData,
  copyLabel,
  variant = "default",
}: DebugSectionProps) => {
  const { toast } = useToast();

  const copyToClipboard = (e: React.MouseEvent) => {
    if (!copyData) return;
    e.stopPropagation();
    navigator.clipboard.writeText(copyData);
    toast({
      title: "Copied to clipboard",
      description: `${copyLabel || title} has been copied to your clipboard.`,
    });
  };

  const bgColor = variant === "error" ? "bg-red-900/20" : "bg-black/30";

  return (
    <div className="space-y-2">
      <div className="font-medium" style={{ color: titleColor }}>
        {title}
      </div>
      <div className={`${bgColor} p-3 rounded-md font-mono overflow-x-auto`}>
        {copyData && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
