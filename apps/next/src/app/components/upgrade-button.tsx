"use client";

import { Button } from "@/components/ui/button";
import redirectToBillingPortal from "@/actions/redirectToBillingPortal";

export function UpgradeButton({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) {
  const handleClick = () => {
    redirectToBillingPortal(path);
  };

  return (
    <Button onClick={handleClick} variant="outline" className="cursor-pointer">
      {children}
    </Button>
  );
}
