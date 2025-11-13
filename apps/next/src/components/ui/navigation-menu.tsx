"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  forwardRef,
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
  children: React.ReactNode;
  className?: string;
};

const NavigationMenu = forwardRef<HTMLDivElement, NavigationMenuProps>(
  ({ className, children, ...props }, ref) => {
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
            "relative z-10 flex max-w-max flex-1 items-center justify-center",
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
  }
);
NavigationMenu.displayName = "NavigationMenu";

const NavigationMenuList = forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    ref={ref}
    {...props}
  />
));
NavigationMenuList.displayName = "NavigationMenuList";

type NavigationMenuItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  children: React.ReactNode;
  value?: string;
};

const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  ({ children, ...props }, ref) => (
    <li ref={ref} {...props}>
      {children}
    </li>
  )
);
NavigationMenuItem.displayName = "NavigationMenuItem";

const navigationMenuTriggerStyle =
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-[var(--nav-item-bg)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";

type NavigationMenuTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    children: React.ReactNode;
  };

const NavigationMenuTrigger = forwardRef<
  HTMLButtonElement,
  NavigationMenuTriggerProps
>(({ className, children, value, ...props }, ref) => {
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
});
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

type NavigationMenuContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  children: React.ReactNode;
};

const NavigationMenuContent = forwardRef<
  HTMLDivElement,
  NavigationMenuContentProps
>(({ className, children, value, ...props }, ref) => {
  const { openItem } = useNavigationMenu();
  const isOpen = openItem === value;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fade-in-0 zoom-in-95 slide-in-from-top-2 md:-translate-x-1/2 absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] max-w-[600px] animate-in md:left-1/2 md:w-auto",
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="relative z-50 rounded-md border bg-popover text-popover-foreground shadow-lg">
        {children}
      </div>
    </div>
  );
});
NavigationMenuContent.displayName = "NavigationMenuContent";

type NavigationMenuLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
};

const NavigationMenuLink = forwardRef<
  HTMLAnchorElement,
  NavigationMenuLinkProps
>(({ className, href, children, ...props }, ref) => (
  <Link className={className} href={href} ref={ref} {...props}>
    {children}
  </Link>
));
NavigationMenuLink.displayName = "NavigationMenuLink";

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
};
