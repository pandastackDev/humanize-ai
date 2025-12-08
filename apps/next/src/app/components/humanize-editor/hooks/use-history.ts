import { useEffect, useState } from "react";
import { HISTORY_STORAGE_KEY } from "../constants";
import type { HistoryItem } from "../types";

export function useHistory() {
  // Use lazy initializer to load from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: HistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    return [];
  });

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  }, [history]);

  return { history, setHistory };
}
