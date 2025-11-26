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
  const [wordBalance, setWordBalance] = useState<number | null>(null);
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

        setWordBalance(purchaseBalance);
        // Total = subscription monthly limit remaining + one-time purchases
        setTotalAvailable(subWords + purchaseBalance);
      } catch (error) {
        console.error("Error fetching word balances:", error);
        setWordBalance(0);
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

          setWordBalance(purchaseBalance);
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
      <div className="flex items-center gap-2">
        <div className="hidden h-9 items-center gap-1 rounded-md bg-accent px-4 text-sm sm:flex">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-semibold">
            {loading ? "..." : (totalAvailable ?? 0).toLocaleString()}
          </span>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Get more words</Button>
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
