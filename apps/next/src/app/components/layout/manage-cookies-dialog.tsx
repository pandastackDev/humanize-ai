"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { Label } from "@humanize/ui/components/label";
import { Switch } from "@humanize/ui/components/switch";
import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type CookieCategory = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

type ManageCookiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "essential",
    name: "Essential",
    description:
      "Cookies that are necessary to operate the service, such as logging you in and keeping your account secure.",
    required: true,
    enabled: true,
  },
  {
    id: "analytics",
    name: "Analytics",
    description:
      "Cookies that are used by us and our partners to help us understand how our websites are used in order to improve our services.",
    required: false,
    enabled: false,
  },
  {
    id: "marketing",
    name: "Marketing",
    description:
      "Cookies that are used to deliver personalized advertisements and track the effectiveness of our marketing campaigns.",
    required: false,
    enabled: false,
  },
  {
    id: "functional",
    name: "Functional",
    description:
      "Cookies that enable enhanced functionality and personalization, such as remembering your preferences and settings.",
    required: false,
    enabled: false,
  },
];

// Helper function to get default cookie preferences
const getDefaultPreferences = (): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {};
  for (const cat of COOKIE_CATEGORIES) {
    defaults[cat.id] = cat.enabled;
  }
  return defaults;
};

export function ManageCookiesDialog({
  open,
  onOpenChange,
}: ManageCookiesDialogProps) {
  const [cookiePreferences, setCookiePreferences] = useState<
    Record<string, boolean>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (open) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        const saved = localStorage.getItem("cookiePreferences");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCookiePreferences(parsed);
          } catch {
            // If parsing fails, use default
            setCookiePreferences(getDefaultPreferences());
          }
        } else {
          // Set defaults
          setCookiePreferences(getDefaultPreferences());
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const handleToggle = (categoryId: string, checked: boolean) => {
    const category = COOKIE_CATEGORIES.find((cat) => cat.id === categoryId);
    if (category?.required) {
      return; // Don't allow toggling required cookies
    }
    setCookiePreferences((prev) => {
      const updated = { ...prev, [categoryId]: checked };
      // Check if preferences changed from saved
      const saved = localStorage.getItem("cookiePreferences");
      if (saved) {
        try {
          const savedPrefs = JSON.parse(saved);
          setHasChanges(JSON.stringify(updated) !== JSON.stringify(savedPrefs));
        } catch {
          setHasChanges(true);
        }
      } else {
        // Compare with defaults
        const defaults = getDefaultPreferences();
        setHasChanges(JSON.stringify(updated) !== JSON.stringify(defaults));
      }
      return updated;
    });
  };

  const handleAcceptAll = () => {
    const allEnabled: Record<string, boolean> = {};
    for (const cat of COOKIE_CATEGORIES) {
      allEnabled[cat.id] = true;
    }
    setCookiePreferences(allEnabled);
    localStorage.setItem("cookiePreferences", JSON.stringify(allEnabled));
    localStorage.setItem("cookieConsent", "accepted");
    setHasChanges(false);
    onOpenChange(false);
    // Trigger cookie consent callback
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookiePreferencesChanged", {
          detail: allEnabled,
        })
      );
    }
  };

  const handleDeclineAll = () => {
    const minimalEnabled: Record<string, boolean> = {};
    for (const cat of COOKIE_CATEGORIES) {
      minimalEnabled[cat.id] = cat.required; // Only essential cookies
    }
    setCookiePreferences(minimalEnabled);
    localStorage.setItem("cookiePreferences", JSON.stringify(minimalEnabled));
    localStorage.setItem("cookieConsent", "declined");
    setHasChanges(false);
    onOpenChange(false);
    // Trigger cookie consent callback
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookiePreferencesChanged", {
          detail: minimalEnabled,
        })
      );
    }
  };

  const handleSave = () => {
    localStorage.setItem(
      "cookiePreferences",
      JSON.stringify(cookiePreferences)
    );
    localStorage.setItem("cookieConsent", "custom");
    setHasChanges(false);
    onOpenChange(false);
    // Trigger cookie consent callback
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookiePreferencesChanged", {
          detail: cookiePreferences,
        })
      );
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg border-slate-200 bg-white text-left dark:border-[#1d1d1d] dark:bg-[#1d1d1d]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 font-semibold text-slate-900 text-xl dark:text-white">
            <Cookie className="h-5 w-5" />
            Manage cookies
          </DialogTitle>
          <DialogDescription className="mt-2 text-slate-600 text-sm leading-relaxed dark:text-slate-300">
            We use cookies to improve your experience and analyze site traffic.
            For more information, read our{" "}
            <Link
              className="text-slate-900 underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
              href="/cookie-policy"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              cookie policy
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {COOKIE_CATEGORIES.map((category) => (
            <div
              className="space-y-2 border-slate-200 border-b pb-4 last:border-b-0 dark:border-[#343434]"
              key={category.id}
            >
              <div className="flex items-center justify-between">
                <Label
                  className="font-semibold text-slate-900 text-sm dark:text-white"
                  htmlFor={`cookie-${category.id}`}
                >
                  {category.name}
                </Label>
                <Switch
                  checked={cookiePreferences[category.id] ?? category.enabled}
                  className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600"
                  disabled={category.required}
                  id={`cookie-${category.id}`}
                  onCheckedChange={(checked) =>
                    handleToggle(category.id, checked)
                  }
                />
              </div>
              <p className="text-slate-500 text-xs dark:text-slate-400">
                {category.description}
              </p>
              {category.required && (
                <p className="text-slate-400 text-xs dark:text-slate-500">
                  This cookie is required and cannot be disabled.
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-[#343434] dark:bg-[#1d1d1d] dark:text-white dark:hover:bg-[#282828]"
            onClick={handleDeclineAll}
            type="button"
            variant="outline"
          >
            Decline all
          </Button>
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={hasChanges ? handleSave : handleAcceptAll}
            type="button"
          >
            {hasChanges ? "Save preferences" : "Accept all"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
