
import { Skeleton } from "@/components/ui/skeleton";

export const ExchangeRateSkeleton = () => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between gap-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
    </div>
  );
};
