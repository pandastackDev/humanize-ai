"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const fetchWordBalance = async () => {
      try {
        const response = await fetch(
          `/api/word-balance?organizationId=${encodeURIComponent(organizationId)}`
        );
        if (response.ok) {
          const data = await response.json();
          setWordBalance(data.word_balance || 0);
        } else {
          setWordBalance(0);
        }
      } catch (error) {
        console.error("Error fetching word balance:", error);
        setWordBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWordBalance();
  }, [organizationId]);

  // Refresh balance when dialog closes (after purchase)
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && organizationId) {
      // Refresh balance after purchase
      setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/word-balance?organizationId=${encodeURIComponent(organizationId)}`
          );
          if (response.ok) {
            const data = await response.json();
            setWordBalance(data.word_balance || 0);
          }
        } catch (err) {
          console.error("Error refreshing balance:", err);
        }
      }, 1000);
    }
  };

  if (!organizationId) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-semibold">
            {loading ? "..." : (wordBalance ?? 0).toLocaleString()}
          </span>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="hidden sm:flex"
        >
          Get more words
        </Button>
      </div>
      <WordPurchaseDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        userId={userId}
        organizationId={organizationId}
        currentBalance={wordBalance ?? 0}
      />
    </>
  );
}

