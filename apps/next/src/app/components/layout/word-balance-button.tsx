"use client";

import { Button } from "@humanize/ui/components/button";
import { useEffect, useState } from "react";
import { checkSubscription } from "@/lib/subscription-api";
import { WordPurchaseDialog } from "../word-purchase-dialog";

type WordBalanceButtonProps = {
  userId: string;
  organizationId?: string;
};

export function WordBalanceButton({
  userId,
  organizationId,
}: WordBalanceButtonProps) {
  const [totalAvailable, setTotalAvailable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!(organizationId && userId)) {
      setLoading(false);
      return;
    }

    const fetchBalances = async () => {
      try {
        // Fetch both subscription words and purchase balance in parallel
        const [subscriptionResponse, balanceResponse] = await Promise.all([
          // Get subscription words remaining
          checkSubscription(userId, organizationId).catch(() => null),
          // Get one-time purchase balance
          fetch(
            `/api/word-balance?organizationId=${encodeURIComponent(organizationId)}`
          )
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ]);

        const subWords = subscriptionResponse?.words_remaining || 0;
        const purchaseBalance = balanceResponse?.word_balance || 0;

        // Total = subscription monthly limit remaining + one-time purchases
        setTotalAvailable(subWords + purchaseBalance);
      } catch (error) {
        console.error("Error fetching word balances:", error);
        setTotalAvailable(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [organizationId, userId]);

  // Refresh balance when dialog closes (after purchase)
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && organizationId && userId) {
      // Refresh both balances after purchase
      setTimeout(async () => {
        try {
          const [subscriptionResponse, balanceResponse] = await Promise.all([
            checkSubscription(userId, organizationId).catch(() => null),
            fetch(
              `/api/word-balance?organizationId=${encodeURIComponent(organizationId)}`
            )
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
          ]);

          const subWords = subscriptionResponse?.words_remaining || 0;
          const purchaseBalance = balanceResponse?.word_balance || 0;

          setTotalAvailable(subWords + purchaseBalance);
        } catch (err) {
          console.error("Error refreshing balance:", err);
        }
      }, 1000);
    }
  };

  // if (!organizationId) {
  //   return null;
  // }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden h-9 items-center gap-1 rounded-md bg-accent px-2 text-xs sm:flex sm:px-3 sm:text-sm md:px-4">
          <span className="hidden text-muted-foreground sm:inline">
            Balance:
          </span>
          <span className="whitespace-nowrap font-semibold">
            {loading ? "..." : (totalAvailable ?? 0).toLocaleString()}
          </span>
        </div>
        <Button
          className="h-8 cursor-pointer px-2 text-xs sm:h-9 sm:px-3 sm:text-sm md:px-4"
          onClick={() => setDialogOpen(true)}
          size="sm"
        >
          <span className="hidden sm:inline">Get more words</span>
          <span className="sm:hidden">Get more</span>
        </Button>
      </div>
      <WordPurchaseDialog
        currentBalance={totalAvailable ?? 0}
        onOpenChange={handleDialogClose}
        open={dialogOpen}
        organizationId={organizationId}
        userId={userId}
      />
    </>
  );
}
