"use client";

import { Button } from "@humanize/ui/components/button";
import { Info } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * The 'subscriptionLevel' prop is the name of the subscription plan and is directly tied to the Stripe price lookup key.
 * You will need to have a price in Stripe with the same lookup key as the subscriptionLevel.
 * See https://docs.stripe.com/products-prices/pricing-models for more details
 */
export function ModalDialog({
  subscriptionLevel,
  userId,
}: {
  subscriptionLevel: string;
  userId: string;
}) {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const formatErrorMessage = (errorMsg: string): string => {
    if (errorMsg.includes("WorkOS")) {
      return `${errorMsg}. Please check your WorkOS API configuration in environment variables.`;
    }
    if (errorMsg.includes("Stripe")) {
      return `${errorMsg}. Please check your Stripe API configuration and ensure products/prices are set up.`;
    }
    if (errorMsg.includes("organization")) {
      return `${errorMsg}. Please try a different organization name or contact support.`;
    }
    if (
      errorMsg.includes("fetch failed") ||
      errorMsg.includes("NetworkError")
    ) {
      return "Network error: Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (errorMsg.includes("timeout") || errorMsg.includes("aborted")) {
      return "Request timed out. Please try again.";
    }
    return errorMsg;
  };

  const handleSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    if (orgName === "") {
      setError("Please fill out Organization name before submitting.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          orgName,
          subscriptionLevel: subscriptionLevel.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          error: `HTTP ${res.status}: ${res.statusText}`,
        }));
        throw new Error(
          errorData.error || `Failed to subscribe: ${res.statusText}`
        );
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No checkout URL received from server");
    } catch (err) {
      console.error("Subscription error:", err);
      const errorMessage =
        err instanceof Error
          ? formatErrorMessage(err.message)
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button onClick={() => setError("")}>Subscribe</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to {subscriptionLevel}</DialogTitle>
          <DialogDescription>
            Enter details about your business
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && orgName && !loading) {
                  e.preventDefault();
                  // Trigger subscribe using a synthetic event
                  const button = document.getElementById("subscribe-button");
                  if (button) {
                    button.click();
                  }
                }
              }}
              placeholder="Enter your organization name"
              value={orgName}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={loading}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={loading || !orgName}
            id="subscribe-button"
            onClick={handleSubscribe}
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" size="sm" />
                Subscribing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
