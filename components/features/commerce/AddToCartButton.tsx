"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/provider";

interface Artwork {
  id: string;
  title: string;
  price: number;
  artworkId?: string;
  variantId?: string | null;
}

type ButtonProps = {
  artwork: Artwork;
  disabled?: boolean;
  className?: string;
};

export default function AddToCartButton({ artwork, disabled = false, className = "" }: ButtonProps) {
  const { t } = useI18n();
  const { addToCart, cart, selectReservation } = useCart();

  const normalizedArtwork = useMemo(() => {
    const [baseId, ...variantParts] = artwork.id.split(":");
    const fallbackVariant = variantParts.length > 0 ? variantParts.join(":") : null;
    return {
      id: artwork.id,
      artworkId: artwork.artworkId || baseId || artwork.id,
      variantId: artwork.variantId ?? fallbackVariant,
      title: artwork.title,
      price: artwork.price,
      quantity: 1,
    };
  }, [artwork]);

  const existingItem = cart.find((item) => item.id === normalizedArtwork.id);
  const computedDisabled = disabled;
  const label = existingItem
    ? (t ? t("cart.button.current") : "Déjà dans votre sélection")
    : (t ? t("cart.button.add") : "Ajouter à ma sélection");

  const handleAddToCart = () => {
    if (computedDisabled) return;
    if (existingItem) {
      selectReservation(existingItem.id);
      return;
    }
    const saved = addToCart(normalizedArtwork);
    if (saved) {
      try {
        window.dispatchEvent(
          new CustomEvent("showEstimate", {
            detail: {
              artworkId: normalizedArtwork.artworkId,
              variantId: normalizedArtwork.variantId ?? undefined,
            },
          })
        );
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={computedDisabled}
        aria-disabled={computedDisabled}
        className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition text-sm"
      >
        {label}
      </button>

      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <p>
          {t
            ? t("cart.selection.local_notice")
            : "Cette sélection reste locale : nous vous rappelons lorsqu’une œuvre part avant validation."}
        </p>
        <p className="mt-1">
          {t
            ? t("cart.selection.multi_notice")
            : "Ajoutez plusieurs pièces pour les comparer avant de confirmer."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/selection"
            className="text-xs font-semibold text-slate-900 underline decoration-dotted underline-offset-2 hover:text-slate-600"
          >
            {t ? t("cart.selection.view_cart") : "Voir ma sélection"}
          </Link>
          {existingItem ? (
            <button
              type="button"
              onClick={() => selectReservation(existingItem.id)}
              className="text-xs font-semibold text-emerald-700 underline decoration-dotted underline-offset-2"
            >
              {t ? t("cart.selection.focus_item") : "Mettre cette œuvre en avant"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
