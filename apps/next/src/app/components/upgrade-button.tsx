"use client";

import redirectToBillingPortal from "@/actions/redirectToBillingPortal";
import { Button } from "@/components/ui/button";

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
    <Button className="cursor-pointer" onClick={handleClick} variant="outline">
      {children}
    </Button>
  );
}
