
// This file provides toast functionality using the shadcn toast component
import { 
  useToast as useShadcnToast, 
  type ToastActionElement,
  type ToastProps
} from "@/components/ui/toast";

export type { ToastActionElement, ToastProps };

export const useToast = useShadcnToast;

export const toast = (props: {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
}) => {
  // We can add filtering here if needed
  // For now, we just pass through to the shadcn toast
  return useShadcnToast().toast(props);
};
