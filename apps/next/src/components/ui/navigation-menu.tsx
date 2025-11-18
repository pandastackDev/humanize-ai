"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  createContext,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useState,
} from "react";

import { cn } from "@/lib/utils";

type NavigationMenuContextValue = {
  openItem: string | null;
  setOpenItem: (item: string | null) => void;
};

const NavigationMenuContext = createContext<
  NavigationMenuContextValue | undefined
>(undefined);

function useNavigationMenu() {
  const context = useContext(NavigationMenuContext);
  if (!context) {
    throw new Error(
      "NavigationMenu components must be used within NavigationMenu"
    );
  }
  return context;
}

type NavigationMenuProps = {
  children: ReactNode;
  className?: string;
};

const NavigationMenu = ({
  className,
  children,
  ref,
  ...props
}: NavigationMenuProps & { ref?: RefObject<HTMLDivElement | null> }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-navigation-menu]")) {
        setOpenItem(null);
      }
    };

    if (openItem) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openItem]);

  return (
    <NavigationMenuContext.Provider value={{ openItem, setOpenItem }}>
      <div
        className={cn(
          "relative z-10 flex max-w-max flex-1 items-center justify-center overflow-visible",
          className
        )}
        data-navigation-menu
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </NavigationMenuContext.Provider>
  );
};
NavigationMenu.displayName = "NavigationMenu";

const NavigationMenuList = ({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLUListElement> & {
  ref?: RefObject<HTMLUListElement | null>;
}) => (
  <ul
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1 overflow-visible",
      className
    )}
    ref={ref}
    {...props}
  />
);
NavigationMenuList.displayName = "NavigationMenuList";

type NavigationMenuItemProps = LiHTMLAttributes<HTMLLIElement> & {
  children: ReactNode;
  value?: string;
};

const NavigationMenuItem = ({
  children,
  ref,
  ...props
}: NavigationMenuItemProps & { ref?: RefObject<HTMLLIElement | null> }) => (
  <li className="relative" ref={ref} {...props}>
    {children}
  </li>
);
NavigationMenuItem.displayName = "NavigationMenuItem";

const navigationMenuTriggerStyle =
"group inline-flex h-9 w-max items-center justify-center rounded-md bg-white dark:bg-white px-4 py-2 text-[14px] font-[600] text-[#646464] transition-all duration-200 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-50 hover:text-[#646464] active:bg-gray-50 dark:active:bg-gray-50 focus:bg-gray-50 dark:focus:bg-gray-50 focus:text-[#646464] focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
type NavigationMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  children: ReactNode;
};

const NavigationMenuTrigger = ({
  className,
  children,
  value,
  ref,
  ...props
}: NavigationMenuTriggerProps & {
  ref?: RefObject<HTMLButtonElement | null>;
}) => {
  const { openItem, setOpenItem } = useNavigationMenu();
  const isOpen = openItem === value;

  return (
    <button
      aria-expanded={isOpen}
      className={cn(
        navigationMenuTriggerStyle,
        isOpen && "bg-accent/50 text-accent-foreground",
        "group",
        className
      )}
      onClick={() => setOpenItem(isOpen ? null : value)}
      ref={ref}
      type="button"
      {...props}
    >
      {children}{" "}
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "relative top-px ml-1 h-3 w-3 transition-transform duration-300",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
};
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

type NavigationMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  children: ReactNode;
};

const NavigationMenuContent = ({
  className,
  children,
  value,
  ref,
  ...props
}: NavigationMenuContentProps & {
  ref?: RefObject<HTMLDivElement | null>;
}) => {
  const { openItem } = useNavigationMenu();
  const isOpen = openItem === value;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fade-in-0 zoom-in-95 slide-in-from-top-2 md:-translate-x-1/2 absolute top-full left-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-[600px] animate-in md:left-1/2 md:w-auto",
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="relative rounded-md border bg-popover text-popover-foreground shadow-lg">
        {children}
      </div>
    </div>
  );
};
NavigationMenuContent.displayName = "NavigationMenuContent";

type NavigationMenuLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

const NavigationMenuLink = ({
  className,
  href,
  children,
  ref,
  ...props
}: NavigationMenuLinkProps & { ref?: RefObject<HTMLAnchorElement | null> }) => (
  <Link className={className} href={href} ref={ref} {...props}>
    {children}
  </Link>
);
NavigationMenuLink.displayName = "NavigationMenuLink";

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
