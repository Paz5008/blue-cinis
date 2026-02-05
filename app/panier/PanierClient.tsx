"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CheckoutEstimate from '@/components/features/commerce/CheckoutEstimate';
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import { useI18n } from "@/i18n/provider";

export default function PanierClient() {
  const { t } = useI18n();
  const { cart, reservation, hasReservation, clearCart, updateQuantity, removeFromCart, selectReservation } = useCart();
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentItem = reservation || cart[0];
  const artworkId = currentItem?.artworkId ?? currentItem?.id ?? null;
  const variantId = currentItem?.variantId ?? null;
  const quantity = currentItem?.quantity ?? 1;

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      }),
    []
  );

  async function checkout() {
    if (!accept || !artworkId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, variantId: variantId || undefined, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "checkout_failed");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("missing_checkout_url");
      }
    } catch (e) {
      console.error("checkout error", e);
      setError("error");
    } finally {
      setLoading(false);
    }
  }

  const emptyState = (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
      <p className="font-medium">{t("cart.page.empty.title")}</p>
      <p className="mt-2">{t("cart.page.empty.subtitle")}</p>
      <Link
        href="/galerie"
        className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        {t("cart.page.empty.cta")}
      </Link>
    </div>
  );

  return (
    <section className="p-8">
      <h1 className="mb-2 text-3xl font-bold">{t("cart.page.title")}</h1>
      <p className="mb-6 text-sm text-gray-600">{t("cart.page.description")}</p>
      {!hasReservation ? (
        emptyState
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
            <p>{t("cart.selection.banner_notice")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("cart.selection.banner_subtitle")}</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <SelectionList
                items={cart}
                activeId={currentItem?.id ?? null}
                selectReservation={selectReservation}
                removeFromCart={removeFromCart}
                priceFormatter={priceFormatter}
                t={t}
              />
            </div>
            {currentItem ? (
              <div className="space-y-4">
                <ReservationBanner item={currentItem} />
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold">{t("cart.page.details.title")}</h2>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li className="flex items-center justify-between">
                      <span>{t("cart.page.details.artwork")}</span>
                      <span className="font-medium">{currentItem.title}</span>
                    </li>
                    <li className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-600">{t("cart.page.details.quantity")}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-slate-300 text-lg leading-none text-slate-700 hover:bg-slate-50"
                          onClick={() => updateQuantity(currentItem.id, Math.max(1, quantity - 1))}
                          aria-label={t("cart.page.quantity_minus")}
                        >
                          –
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={quantity}
                          onChange={(e) => updateQuantity(currentItem.id, Number(e.target.value))}
                          className="w-14 rounded border border-slate-300 px-2 py-1 text-center"
                        />
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-slate-300 text-lg leading-none text-slate-700 hover:bg-slate-50"
                          onClick={() => updateQuantity(currentItem.id, Math.min(10, quantity + 1))}
                          aria-label={t("cart.page.quantity_plus")}
                        >
                          +
                        </button>
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>{t("cart.page.details.price")}</span>
                      <span className="font-semibold">
                        {typeof currentItem.price === "number"
                          ? priceFormatter.format(currentItem.price * quantity)
                          : "—"}
                      </span>
                    </li>
                  </ul>
                </div>
                {artworkId ? (
                  <CheckoutEstimate
                    key={`${artworkId}-${variantId ?? "base"}`}
                    artworkId={artworkId}
                    variantId={variantId}
                    quantity={quantity}
                  />
                ) : null}
                <p className="text-xs text-slate-500">
                  {t("cart.page.checkout_hint")}
                </p>
                <label className="flex items-center space-x-2 text-sm text-slate-700">
                  <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                  <span>
                    {t("cart.page.terms_prefix")}{" "}
                    <Link href="/mentions-legales" className="underline">
                      {t("cart.page.terms_link")}
                    </Link>
                  </span>
                </label>
                {error && <p className="text-sm text-red-600">{t("cart.page.error_generic")}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={checkout}
                    disabled={!accept || !artworkId || loading}
                    className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                  >
                    {loading ? t("cart.page.checkout_loading") : t("cart.page.checkout")}
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded bg-gray-200 px-4 py-2 text-gray-800"
                  >
                    {t("cart.page.clear")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

type SelectionListProps = {
  items: CartItem[];
  activeId: string | null;
  selectReservation: (id: string) => void;
  removeFromCart: (id: string) => void;
  priceFormatter: Intl.NumberFormat;
  t: (key: string) => string;
};

function SelectionList({ items, activeId, selectReservation, removeFromCart, priceFormatter, t }: SelectionListProps) {
  if (!items.length) return null;
  const headline = items.length === 1 ? t("cart.selection.single") : t("cart.selection.multi");
  const countLabel = translateWithCount(t, "cart.selection.count", items.length, {
    fr: items.length === 1 ? "1 œuvre" : `${items.length} œuvres`,
    en: items.length === 1 ? "1 artwork" : `${items.length} artworks`,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{headline}</h2>
        <span className="text-sm text-slate-500">{countLabel}</span>
      </div>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const quantityLabel = translateWithCount(t, "cart.selection.quantity", item.quantity, {
          fr: item.quantity === 1 ? "1 exemplaire" : `${item.quantity} exemplaires`,
          en: item.quantity === 1 ? "1 item" : `${item.quantity} items`,
        });
        return (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition ${isActive ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"
              }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                name="selected-artwork"
                checked={isActive}
                onChange={() => selectReservation(item.id)}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                aria-label={t("cart.selection.choose")}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {priceFormatter.format(item.price)} · {quantityLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs font-semibold text-red-600 underline-offset-2 hover:underline"
                  >
                    {t("cart.page.remove")}
                  </button>
                </div>
                <SelectionCountdown expiresAt={item.expiresAt} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SelectionCountdown({ expiresAt }: { expiresAt?: number | null }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(expiresAt));

  useEffect(() => {
    setTimeLeft(computeTimeLeft(expiresAt));
    if (!expiresAt) {
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <p className="text-xs text-slate-500">
        {t("cart.selection.local_only")}
      </p>
    );
  }
  const formatted = formatDuration(timeLeft);

  return (
    <p className="text-xs text-slate-500">
      {t("cart.page.countdown_prefix")} <span className="font-semibold">{formatted}</span>{" "}
      {t("cart.page.countdown_suffix")} <span className="text-slate-400">({t("cart.selection.local_only")})</span>
    </p>
  );
}

function ReservationBanner({ item }: { item: CartItem }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(item.expiresAt));

  useEffect(() => {
    setTimeLeft(computeTimeLeft(item.expiresAt));
    if (!item.expiresAt) {
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(item.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [item.expiresAt]);

  const formatted = formatDuration(timeLeft);

  return (
    <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{t("cart.page.banner.prefix")} {item.title}</p>
      <p>{t("cart.page.banner.suffix")}</p>
      {item.expiresAt ? (
        <p className="mt-1 text-xs text-amber-800">
          {t("cart.page.countdown_prefix")}{" "}
          <span className="font-semibold">{formatted}</span> {t("cart.page.countdown_suffix")}
        </p>
      ) : null}
    </div>
  );
}

function computeTimeLeft(expiresAt?: number | null) {
  if (!expiresAt) {
    return 0;
  }
  return Math.max(0, expiresAt - Date.now());
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function translateWithCount(
  t: (key: string) => string,
  key: string,
  count: number,
  fallback: { fr: string; en: string },
) {
  const template = t(key);
  if (template === key) {
    // Use the locale inferred from html tag via documentElement.lang when possible
    if (typeof document !== "undefined") {
      const lang = document.documentElement.lang;
      if (lang?.startsWith("en")) return fallback.en;
    }
    return fallback.fr;
  }
  return template.replace("{count}", String(count));
}
