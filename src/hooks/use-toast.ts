
// This file is a direct proxy to the shadcn toast component's hooks
import { useToast as useShadcnToast, toast as shadcnToast } from "@/components/ui/use-toast";

export const useToast = useShadcnToast;

export const toast = (props: Parameters<typeof shadcnToast>[0]) => {
  // We can add filtering here if needed
  // For now, we just pass through to the shadcn toast
  return shadcnToast(props);
};
