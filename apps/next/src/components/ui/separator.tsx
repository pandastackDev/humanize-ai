"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type { ComponentPropsWithoutRef, ElementRef, RefObject } from "react";

import { cn } from "@/lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  ref?: RefObject<ElementRef<typeof SeparatorPrimitive.Root> | null>;
}) => (
  <SeparatorPrimitive.Root
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    decorative={decorative}
    orientation={orientation}
    ref={ref}
    {...props}
  />
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
