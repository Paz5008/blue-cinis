"use client";

import { useEffect } from "react";

type Props = {
  rootId: string;
};

export default function PosterCtaTracker({ rootId }: Props) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>("a[data-banner-cta]");
      if (!anchor) return;
      const card = anchor.closest<HTMLElement>("[data-artist-id]");
      if (!card) return;
      const artistId = card.getAttribute("data-artist-id") || "";
      const ctaHref = anchor.getAttribute("href") || "";
      if (!artistId || !ctaHref || ctaHref.startsWith("#") || /^javascript:/i.test(ctaHref)) {
        return;
      }
      const signature = anchor.getAttribute("data-banner-cta-token");
      if (!signature) return;
      const placement = anchor.getAttribute("data-banner-placement") ?? card.getAttribute("data-banner-placement") ?? "home-artist-posters";
      const source = anchor.getAttribute("data-banner-source") ?? card.getAttribute("data-banner-source") ?? "home-artist-posters";
      const payload = {
        artistId,
        ctaHref,
        ctaLabel: anchor.getAttribute("data-banner-cta-label") ?? anchor.textContent ?? undefined,
        presetId: anchor.getAttribute("data-banner-preset") ?? undefined,
        placement,
        source,
        signature,
        timestamp: Date.now(),
      };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/banner/cta", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/banner/cta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    root.addEventListener("click", handleClick, true);
    return () => {
      root.removeEventListener("click", handleClick, true);
    };
  }, [rootId]);

  return null;
}
