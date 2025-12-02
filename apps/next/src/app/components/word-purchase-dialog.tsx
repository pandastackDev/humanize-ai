"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { Input } from "@humanize/ui/components/input";
import { Label } from "@humanize/ui/components/label";
import { LoadingSpinner } from "@humanize/ui/components/loading-spinner";
import { Slider } from "@humanize/ui/components/slider";
import { Check, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

type WordPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  organizationId?: string;
  currentBalance?: number;
};

const MIN_WORDS = 1000;
const MAX_WORDS = 30_000;
const WORDS_PER_PACKAGE = 1000;
const PRICE_PER_PACKAGE = 1.99;

export function WordPurchaseDialog({
  open,
  onOpenChange,
  userId,
  organizationId,
  currentBalance = 0,
}: WordPurchaseDialogProps) {
  const [wordAmount, setWordAmount] = useState(MIN_WORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{
    valid: boolean;
    id: string;
    code: string;
    couponId: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    name: string;
  } | null>(null);

  const packages = Math.floor(wordAmount / WORDS_PER_PACKAGE);
  const subtotal = packages * PRICE_PER_PACKAGE;

  // Calculate discount
  let discountAmount = 0;
  if (promoDiscount?.valid) {
    if (promoDiscount.discountType === "percentage") {
      discountAmount = (subtotal * promoDiscount.discountValue) / 100;
    } else {
      // Fixed amount discount
      discountAmount = Math.min(promoDiscount.discountValue, subtotal);
    }
  }

  const totalPrice = Math.max(0, subtotal - discountAmount);

  const handleSliderChange = (value: number[]) => {
    setWordAmount(value[0] ?? MIN_WORDS);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(value)) {
      const clampedValue = Math.max(MIN_WORDS, Math.min(MAX_WORDS, value));
      // Round to nearest 1000
      const roundedValue =
        Math.round(clampedValue / WORDS_PER_PACKAGE) * WORDS_PER_PACKAGE;
      setWordAmount(roundedValue);
      setError(null);
    }
  };

  const handleDecrement = () => {
    if (wordAmount > MIN_WORDS) {
      setWordAmount(Math.max(MIN_WORDS, wordAmount - WORDS_PER_PACKAGE));
      setError(null);
    }
  };

  const handleIncrement = () => {
    if (wordAmount < MAX_WORDS) {
      setWordAmount(Math.min(MAX_WORDS, wordAmount + WORDS_PER_PACKAGE));
      setError(null);
    }
  };

  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promotion code");
      return;
    }

    setValidatingPromo(true);
    setPromoError(null);

    try {
      const response = await fetch("/api/validate-promo-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setPromoDiscount(data);
        setPromoError(null);
      } else {
        setPromoError(data.error || "Invalid promotion code");
        setPromoDiscount(null);
      }
    } catch (err) {
      setPromoError(
        err instanceof Error ? err.message : "Failed to validate promotion code"
      );
      setPromoDiscount(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setPromoDiscount(null);
    setPromoError(null);
    setShowPromoInput(false);
  };

  const renderPromoCodeSection = () => {
    if (promoDiscount?.valid) {
      return (
        <div className="flex items-center justify-between rounded-md bg-success-bg p-2 dark:bg-success-muted">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success dark:text-success" />
            <span className="font-medium text-sm text-success dark:text-success">
              {promoDiscount.code}
            </span>
            {promoDiscount.discountType === "percentage" && (
              <span className="text-success text-xs dark:text-success">
                -{promoDiscount.discountValue}% off
              </span>
            )}
            {promoDiscount.discountType === "fixed" && (
              <span className="text-success text-xs dark:text-success">
                -${promoDiscount.discountValue.toFixed(2)} off
              </span>
            )}
          </div>
          <Button
            className="h-6 w-6 p-0"
            onClick={handleRemovePromoCode}
            size="sm"
            variant="ghost"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (showPromoInput) {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              className="h-9 flex-1 text-sm"
              disabled={validatingPromo}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValidatePromoCode();
                }
              }}
              placeholder="Enter promotion code"
              value={promoCode}
            />
            <Button
              className="h-9 cursor-pointer"
              disabled={validatingPromo || !promoCode.trim()}
              onClick={handleValidatePromoCode}
              size="sm"
              variant="outline"
            >
              {validatingPromo ? <LoadingSpinner size="sm" /> : "Apply"}
            </Button>
            <Button
              className="h-9"
              onClick={() => {
                setShowPromoInput(false);
                setPromoCode("");
                setPromoError(null);
              }}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {promoError && (
            <p className="text-destructive text-xs">{promoError}</p>
          )}
        </div>
      );
    }

    return (
      <Button
        className="h-auto p-0 text-sm"
        onClick={() => setShowPromoInput(true)}
        variant="link"
      >
        Add promotion code
      </Button>
    );
  };

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/purchase-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          organizationId,
          wordAmount,
          packages,
          promotionCodeId: promoDiscount?.id,
          couponId: promoDiscount?.couponId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate purchase");
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-2xl">
            Get more words - One time payment
          </DialogTitle>
          <DialogDescription>
            Need more words? Add them to your balance today. One-time payment –
            no recurring fees. Words stay in your account until you use them.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Panel - Purchase Options */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <Label className="font-semibold text-base">
                Select the amount to buy
              </Label>

              {/* Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>min {MIN_WORDS.toLocaleString()}</span>
                  <span>max {MAX_WORDS.toLocaleString()}</span>
                </div>
                <Slider
                  className="w-full"
                  max={MAX_WORDS}
                  min={MIN_WORDS}
                  onValueChange={handleSliderChange}
                  step={WORDS_PER_PACKAGE}
                  value={[wordAmount]}
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="word-amount">Words</Label>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-10 w-10"
                    disabled={wordAmount <= MIN_WORDS}
                    onClick={handleDecrement}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    className="text-center font-semibold text-lg"
                    id="word-amount"
                    max={MAX_WORDS}
                    min={MIN_WORDS}
                    onChange={handleInputChange}
                    step={WORDS_PER_PACKAGE}
                    type="number"
                    value={wordAmount}
                  />
                  <Button
                    className="h-10 w-10"
                    disabled={wordAmount >= MAX_WORDS}
                    onClick={handleIncrement}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  {packages} package{packages !== 1 ? "s" : ""} ×{" "}
                  {WORDS_PER_PACKAGE.toLocaleString()} words ={" "}
                  {wordAmount.toLocaleString()} words for $
                  {totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Purchase Button */}
              <Button
                className="h-12 w-full cursor-pointer font-semibold text-base"
                disabled={loading || wordAmount < MIN_WORDS}
                onClick={handlePurchase}
                size="lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Processing...
                  </>
                ) : (
                  "Buy words"
                )}
              </Button>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Checkout Summary */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <h3 className="font-bold text-xl">Pay Humanize</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-3xl">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Words Package</span>
                    <span className="font-medium">
                      Qty {packages} × ${PRICE_PER_PACKAGE.toFixed(2)} each
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {promoDiscount?.valid && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success dark:text-success">
                      <div className="flex items-center gap-1">
                        <span>Discount ({promoDiscount.code})</span>
                        {promoDiscount.discountType === "percentage" ? (
                          <span className="text-xs">
                            -{promoDiscount.discountValue}%
                          </span>
                        ) : (
                          <span className="text-xs">
                            -${promoDiscount.discountValue.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        -${discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total due</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2">{renderPromoCodeSection()}</div>
              </div>
            </div>

            {/* Current Balance Display */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Current Balance
                </span>
                <span className="font-semibold text-lg">
                  {currentBalance.toLocaleString()} words
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  After Purchase
                </span>
                <span className="font-semibold text-lg text-success">
                  {(currentBalance + wordAmount).toLocaleString()} words
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
