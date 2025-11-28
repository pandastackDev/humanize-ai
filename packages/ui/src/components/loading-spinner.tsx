import { cn } from "@humanize/ui/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <svg
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "motion-safe:animate-spin",
        sizeClasses[size],
        className
      )}
    >
      <path
        d="M9.5 2.9375V5.5625M9.5 13.4375V16.0625M2.9375 9.5H5.5625M13.4375 9.5H16.0625"
        stroke="currentColor"
        strokeWidth="1.875"
        strokeLinecap="round"
      />
      <path
        d="M4.86011 4.85961L6.71627 6.71577M12.2847 12.2842L14.1409 14.1404M4.86011 14.1404L6.71627 12.2842M12.2847 6.71577L14.1409 4.85961"
        stroke="currentColor"
        strokeWidth="1.875"
        strokeLinecap="round"
      />
    </svg>
  );
}

