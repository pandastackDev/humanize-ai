import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with a safe default that will be updated in useEffect
  const [isMobile, setIsMobile] = useState<boolean | undefined>(() => {
    if (typeof window === "undefined") {
      return;
    }
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // Initial check - only update if different from initial state
    const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (isMobile !== currentIsMobile) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsMobile(currentIsMobile);
      }, 0);
    }
    return () => mql.removeEventListener("change", onChange);
  }, [isMobile]);

  return !!isMobile;
}
