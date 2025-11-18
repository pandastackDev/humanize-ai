"use client";

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  RefObject,
} from "react";
import { createContext, useContext, useState } from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
};

type TabsProps = HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  ref?: RefObject<HTMLDivElement>;
};

const Tabs = ({
  className,
  value,
  onValueChange,
  defaultValue,
  ref,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
      }}
    >
      <div className={className} ref={ref} {...props} />
    </TabsContext.Provider>
  );
};
Tabs.displayName = "Tabs";

type TabsListProps = HTMLAttributes<HTMLDivElement> & {
  ref?: RefObject<HTMLDivElement>;
};

const TabsList = ({ className, ref, ...props }: TabsListProps) => (
  <div
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    ref={ref}
    role="tablist"
    {...props}
  />
);
TabsList.displayName = "TabsList";

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  ref?: RefObject<HTMLButtonElement>;
};

const TabsTrigger = ({
  className,
  value,
  onClick,
  ref,
  ...props
}: TabsTriggerProps) => {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onValueChange(value);
    onClick?.(e);
  };

  return (
    <button
      aria-selected={isActive}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      data-state={isActive ? "active" : "inactive"}
      onClick={handleClick}
      ref={ref}
      role="tab"
      type="button"
      {...props}
    />
  );
};
TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  ref?: RefObject<HTMLDivElement>;
};

const TabsContent = ({ className, value, ref, ...props }: TabsContentProps) => {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      ref={ref}
      role="tabpanel"
      {...props}
    />
  );
};
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
