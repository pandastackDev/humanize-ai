"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ManageCookiesDialog } from "./manage-cookies-dialog";

type CookieConsentBannerProps = {
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  onManageCookies: () => void;
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
};

// Mobile: Modal view
function MobileView({
  showBanner,
  setShowBanner,
  onManageCookies,
  onAcceptAll,
  onRejectNonEssential,
}: CookieConsentBannerProps) {
  return (
    <Dialog onOpenChange={setShowBanner} open={showBanner}>
      <DialogContent className="max-w-sm border-border bg-card p-6 dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-semibold text-foreground text-xl dark:text-foreground">
              We use cookies
            </DialogTitle>
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowBanner(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="mt-4 text-muted-foreground text-sm leading-relaxed dark:text-muted-foreground">
            We use cookies to help this site function, understand service usage,
            and support marketing efforts. Visit{" "}
            <button
              className="text-foreground underline hover:text-muted-foreground dark:text-foreground dark:hover:text-muted-foreground"
              onClick={onManageCookies}
              type="button"
            >
              Manage Cookies
            </button>{" "}
            to change preferences anytime. View our{" "}
            <Link
              className="text-foreground underline hover:text-muted-foreground dark:text-foreground dark:hover:text-muted-foreground"
              href="/cookie-policy"
            >
              Cookie Policy
            </Link>{" "}
            for more info.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            className="w-full bg-foreground text-background hover:bg-muted-foreground dark:bg-background dark:text-foreground dark:hover:bg-muted"
            onClick={onManageCookies}
            type="button"
            variant="default"
          >
            Manage Cookies
          </Button>
          <Button
            className="w-full bg-foreground text-background hover:bg-muted-foreground dark:bg-background dark:text-foreground dark:hover:bg-muted"
            onClick={onAcceptAll}
            type="button"
            variant="default"
          >
            Accept all
          </Button>
          <Button
            className="w-full border-border bg-background text-foreground hover:bg-muted dark:border-[var(--color-select-hover)] dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:hover:bg-[var(--color-select-hover)]"
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

// Desktop: Fixed bottom-left banner
function DesktopView({
  setShowBanner,
  onManageCookies,
  onAcceptAll,
  onRejectNonEssential,
}: Omit<CookieConsentBannerProps, "showBanner">) {
  return (
    <div className="fixed bottom-0 left-0 z-50 hidden w-full max-w-md p-4 md:block">
      <div className="rounded-lg border border-border bg-card p-6 shadow-lg dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-semibold text-foreground text-lg dark:text-foreground">
            We use cookies
          </h3>
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowBanner(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-muted-foreground text-sm leading-relaxed dark:text-muted-foreground">
          We use cookies to help this site function, understand service usage,
          and support marketing efforts. Visit{" "}
          <button
            className="text-foreground underline hover:text-muted-foreground dark:text-foreground dark:hover:text-muted-foreground"
            onClick={onManageCookies}
            type="button"
          >
            Manage Cookies
          </button>{" "}
          to change preferences anytime. View our{" "}
          <Link
            className="text-foreground underline hover:text-muted-foreground dark:text-foreground dark:hover:text-muted-foreground"
            href="/cookie-policy"
          >
            Cookie Policy
          </Link>{" "}
          for more info.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            className="border-border bg-background text-foreground hover:bg-muted dark:border-[var(--color-select-hover)] dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:hover:bg-[var(--color-select-hover)]"
            onClick={onManageCookies}
            type="button"
            variant="outline"
          >
            Manage Cookies
          </Button>
          <Button
            className="border-border bg-background text-foreground hover:bg-muted dark:border-[var(--color-select-hover)] dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:hover:bg-[var(--color-select-hover)]"
            onClick={onRejectNonEssential}
            type="button"
            variant="outline"
          >
            Reject non-essential
          </Button>
          <Button
            className="bg-foreground text-background hover:bg-muted-foreground dark:bg-background dark:text-foreground dark:hover:bg-muted"
            onClick={onAcceptAll}
            type="button"
            variant="default"
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
      <MobileView
        onAcceptAll={handleAcceptAll}
        onManageCookies={handleManageCookies}
        onRejectNonEssential={handleRejectNonEssential}
        setShowBanner={setShowBanner}
        showBanner={showBanner}
      />
      <DesktopView
        onAcceptAll={handleAcceptAll}
        onManageCookies={handleManageCookies}
        onRejectNonEssential={handleRejectNonEssential}
        setShowBanner={setShowBanner}
      />
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
