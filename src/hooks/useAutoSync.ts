"use client";

import { useEffect } from "react";

const INTERVAL_MS: Record<string, number> = {
  "5min":  5  * 60 * 1000,
  "15min": 15 * 60 * 1000,
  "30min": 30 * 60 * 1000,
  "1hr":   60 * 60 * 1000,
};

export function useAutoSync(syncInterval: string) {
  useEffect(() => {
    const ms = INTERVAL_MS[syncInterval];
    if (!ms) return; // "manual" or unknown

    const id = setInterval(async () => {
      try {
        await fetch("/api/drive/sync", { method: "POST" });
      } catch { /* silent fail */ }
    }, ms);

    return () => clearInterval(id);
  }, [syncInterval]);
}
