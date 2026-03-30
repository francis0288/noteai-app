"use client";

import { useState, useEffect } from "react";
import type { LayoutMode } from "@/types";

export function useLayoutMode(): [LayoutMode, (m: LayoutMode) => void] {
  const [mode, setModeState] = useState<LayoutMode>("grid");

  useEffect(() => {
    const stored = localStorage.getItem("layoutMode") as LayoutMode;
    if (stored === "grid" || stored === "list") setModeState(stored);
  }, []);

  function setMode(m: LayoutMode) {
    setModeState(m);
    localStorage.setItem("layoutMode", m);
  }

  return [mode, setMode];
}
