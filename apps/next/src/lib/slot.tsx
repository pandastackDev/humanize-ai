"use client";

import { cn } from "@humanize/ui/lib/utils";
import {
  cloneElement,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type Ref,
} from "react";

interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * Custom Slot component that merges props and refs from parent to child.
 * This replaces @radix-ui/react-slot for the asChild pattern.
 */
function Slot({ children, ref, ...props }: SlotProps) {
  if (!isValidElement(children)) {
    return null;
  }

  const child = children as ReactElement<HTMLAttributes<HTMLElement>>;
  const childProps = child.props as HTMLAttributes<HTMLElement>;
  const childRef = (child as { ref?: Ref<HTMLElement> }).ref;

  return cloneElement(child, {
    ...childProps,
    ...props,
    className: cn(childProps.className, props.className),
    ref: mergeRefs(ref, childRef),
  } as HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> });
}

Slot.displayName = "Slot";

function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (instance: T | null) => void {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref && typeof ref === "object" && "current" in ref) {
        (ref as { current: T | null }).current = instance;
      }
    }
  };
}

export { Slot };
