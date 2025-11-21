import { cn } from "@humanize/ui/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-[#0066ff] dark:text-[#0066ff]",
        sizeClasses[size],
        className
      )}
    />
  );
}
