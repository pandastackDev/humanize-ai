"use client";

import { Button } from "@humanize/ui/components/button";
import { Dialog, DialogContent } from "@humanize/ui/components/dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ManageCookiesDialog } from "./manage-cookies-dialog";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

type CookieConsentBannerProps = {
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  onManageCookies: () => void;
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
};

// Mobile: Centered modal view (like ChatGPT)
function MobileView({
  showBanner,
  setShowBanner,
  onManageCookies,
  onAcceptAll,
  onRejectNonEssential,
}: CookieConsentBannerProps) {
  return (
    <Dialog onOpenChange={setShowBanner} open={showBanner}>
      <DialogContent
        className="border-border bg-card p-0 md:hidden dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center justify-center px-5 pt-4 pb-8 sm:p-10">
          <div className="mb-2 flex w-full justify-end">
            <button
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowBanner(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-2 text-center font-semibold text-card-foreground text-xl">
            We use cookies
          </p>
          <p className="mb-6 text-center text-muted-foreground text-sm">
            We use cookies to help this site function, understand service usage,
            and support marketing efforts. Visit{" "}
            <button
              className="cursor-pointer text-card-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              onClick={onManageCookies}
              type="button"
            >
              Manage Cookies
            </button>{" "}
            to change preferences anytime. View our{" "}
            <Link
              className="text-card-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              href="/cookie-policy"
            >
              Cookie Policy
            </Link>{" "}
            for more info.
          </p>
          <Button
            className="mb-2 w-full sm:mb-3"
            onClick={onManageCookies}
            type="button"
            variant="outline"
          >
            Manage Cookies
          </Button>
          <Button
            className="mb-2 w-full sm:mb-3"
            onClick={onAcceptAll}
            type="button"
            variant="outline"
          >
            Accept all
          </Button>
          <Button
            className="mb-2 w-full sm:mb-3"
            onClick={onRejectNonEssential}
            type="button"
            variant="outline"
          >
            Reject non-essential
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Desktop: Full-width bottom banner (like ChatGPT)
function DesktopView({
  onManageCookies,
  onAcceptAll,
  onRejectNonEssential,
}: Omit<CookieConsentBannerProps, "showBanner" | "setShowBanner">) {
  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 hidden w-full border-t shadow-sm md:block"
      style={{
        backgroundColor: "var(--color-cookie-banner-bg)",
        borderTopColor: "var(--color-cookie-banner-border)",
      }}
    >
      <div className="relative flex w-full flex-col items-center justify-between gap-5 p-5 sm:flex-row sm:gap-0">
        <div className="flex max-w-5xl flex-col gap-2 sm:flex-1">
          <h3 className="font-semibold text-base text-foreground">
            We use cookies
          </h3>
          <p className="text-muted-foreground text-sm">
            We use cookies to help this site function, understand service usage,
            and support marketing efforts. Visit{" "}
            <button
              className="cursor-pointer text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
              onClick={onManageCookies}
              type="button"
            >
              Manage Cookies
            </button>{" "}
            to change preferences anytime. View our{" "}
            <Link
              className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
              href="/cookie-policy"
            >
              Cookie Policy
            </Link>{" "}
            for more info.
          </p>
        </div>
        <div className="flex w-full flex-row justify-end gap-3 sm:w-auto sm:min-w-[300px]">
          <Button
            className="cursor-pointer text-sm"
            onClick={onManageCookies}
            type="button"
            variant="outline"
          >
            Manage Cookies
          </Button>
          <Button
            className="cursor-pointer text-sm"
            onClick={onRejectNonEssential}
            type="button"
            variant="outline"
          >
            Reject non-essential
          </Button>
          <Button
            className="cursor-pointer text-sm"
            onClick={onAcceptAll}
            type="button"
            variant="outline"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [cookiesDialogOpen, setCookiesDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem("cookiePreferences", JSON.stringify(allEnabled));
    localStorage.setItem("cookieConsent", "accepted");
    setShowBanner(false);
    // Trigger cookie consent callback
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookiePreferencesChanged", {
          detail: allEnabled,
        })
      );
    }
  };

  const handleRejectNonEssential = () => {
    const minimalEnabled = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem("cookiePreferences", JSON.stringify(minimalEnabled));
    localStorage.setItem("cookieConsent", "declined");
    setShowBanner(false);
    // Trigger cookie consent callback
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookiePreferencesChanged", {
          detail: minimalEnabled,
        })
      );
    }
  };

  const handleManageCookies = () => {
    setCookiesDialogOpen(true);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {isMobile ? (
        <MobileView
          onAcceptAll={handleAcceptAll}
          onManageCookies={handleManageCookies}
          onRejectNonEssential={handleRejectNonEssential}
          setShowBanner={setShowBanner}
          showBanner={showBanner}
        />
      ) : (
        <DesktopView
          onAcceptAll={handleAcceptAll}
          onManageCookies={handleManageCookies}
          onRejectNonEssential={handleRejectNonEssential}
        />
      )}
      <ManageCookiesDialog
        onOpenChange={(open) => {
          setCookiesDialogOpen(open);
          if (!open) {
            // Check if consent was given in the dialog
            const consent = localStorage.getItem("cookieConsent");
            if (consent) {
              setShowBanner(false);
            }
          }
        }}
        open={cookiesDialogOpen}
      />
    </>
  );
}
