"use client";

import { useEffect, useState } from "react";

// Small accessibility helpers
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    try {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } catch {
      // Safari < 14 fallback
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);
  return reduced;
}
