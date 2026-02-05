"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import VariantSelector from "./VariantSelector";

type VariantOption = {
  id: string;
  name: string;
  priceOverride?: number | null;
  available: number;
};

type AddToCartArtwork = {
  id: string;
  title: string;
  price: number;
  initialAvailability?: number | null;
  variants?: VariantOption[];
};

const REFRESH_INTERVAL_MS = 60_000;

export default function AddToCartWithStock({ artwork }: { artwork: AddToCartArtwork }) {
  const [available, setAvailable] = useState<number | null>(
    typeof artwork.initialAvailability === "number" ? artwork.initialAvailability : null
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    artwork.variants?.[0] ?? null
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshAvailability = useCallback(async () => {
    setStatus((prev) => (prev === "loading" ? prev : "loading"));
    try {
      const res = await fetch(`/api/artworks/${artwork.id}/availability`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "server_error");
      }
      if (!mountedRef.current) return;
      setAvailable(typeof data.available === "number" ? data.available : null);
      setStatus("idle");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
    }
  }, [artwork.id]);

  const hasInitialAvailability = typeof artwork.initialAvailability === "number";

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    function handleVisibility() {
      if (document.visibilityState === "hidden" && interval) {
        clearInterval(interval);
        interval = null;
        return;
      }
      if (document.visibilityState === "visible" && interval === null) {
        interval = setInterval(refreshAvailability, REFRESH_INTERVAL_MS);
        refreshAvailability();
      }
    }

    if (typeof document !== "undefined") {
      if (document.visibilityState === "visible") {
        interval = setInterval(refreshAvailability, REFRESH_INTERVAL_MS);
        if (!hasInitialAvailability) {
          refreshAvailability();
        }
      } else if (!hasInitialAvailability) {
        refreshAvailability();
      }
      document.addEventListener("visibilitychange", handleVisibility);
    } else {
      refreshAvailability();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [hasInitialAvailability, refreshAvailability]);

  const effectiveAvailability = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.available;
    }
    return available;
  }, [available, selectedVariant]);

  const price =
    selectedVariant && typeof selectedVariant.priceOverride === "number"
      ? selectedVariant.priceOverride
      : artwork.price;
  const cartId = selectedVariant ? `${artwork.id}:${selectedVariant.id}` : artwork.id;
  const cartTitle = selectedVariant ? `${artwork.title} – ${selectedVariant.name}` : artwork.title;
  const disabled = typeof effectiveAvailability === "number" ? effectiveAvailability <= 0 : false;

  return (
    <div>
      <VariantSelector variants={artwork.variants ?? []} onChange={setSelectedVariant} />
      <AddToCartButton
        artwork={{
          id: cartId,
          artworkId: artwork.id,
          variantId: selectedVariant?.id ?? null,
          title: cartTitle,
          price,
        }}
        disabled={disabled}
      />
      <div className="mt-1 text-xs text-gray-600">
        {status === "loading"
          ? "Mise à jour du stock…"
          : status === "error"
          ? "Stock indisponible pour le moment."
          : typeof effectiveAvailability === "number"
          ? effectiveAvailability > 0
            ? `En stock: ${effectiveAvailability}`
            : "Plus de stock"
          : "Stock en cours de synchronisation…"}
      </div>
    </div>
  );
}
