"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/provider";

type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

type EstimateResponse = {
  subtotal: number;
  tax: number;
  currency: string;
  shippingOptions: ShippingOption[];
};

type CheckoutEstimateProps = {
  artworkId: string;
  variantId?: string | null;
  quantity?: number;
};

export default function CheckoutEstimate({ artworkId, variantId = null, quantity = 1 }: CheckoutEstimateProps) {
  const { t } = useI18n();
  const [country, setCountry] = useState("FR");
  const [postal, setPostal] = useState("75001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<string | null>(variantId ?? null);
  const normalizedQuantity = Math.max(1, Math.min(10, quantity));

  useEffect(() => {
    setActiveVariant(variantId ?? null);
  }, [variantId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkout_estimate_addr");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.country) setCountry(String(data.country).toUpperCase());
        if (data.postal) setPostal(String(data.postal));
        if (data.ship) setSelectedShip(String(data.ship));
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  const persistAddress = useCallback(
    (shipOverride?: string | null) => {
      try {
        localStorage.setItem(
          "checkout_estimate_addr",
          JSON.stringify({
            country,
            postal,
            ship: typeof shipOverride === "undefined" ? selectedShip : shipOverride,
          })
        );
      } catch {
        // ignore storage failures
      }
    },
    [country, postal, selectedShip]
  );

  useEffect(() => {
    persistAddress();
  }, [persistAddress]);

  const getEstimate = useCallback(
    async (nextVariantId?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const variantToUse = typeof nextVariantId === "undefined" ? activeVariant : nextVariantId;
        const res = await fetch("/api/checkout/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artworkId,
            variantId: variantToUse || undefined,
            quantity: normalizedQuantity,
            address: { country, postal_code: postal },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "estimate_failed");
        }
        const normalizedOptions: ShippingOption[] = Array.isArray(data.shippingOptions)
          ? data.shippingOptions
              .filter((opt: any) => opt && typeof opt.id === "string")
              .map((opt: any) => ({
                id: String(opt.id),
                name: typeof opt.name === "string" ? opt.name : "Option",
                amount: Number(opt.amount) || 0,
                currency: typeof opt.currency === "string" ? opt.currency : data.currency || "eur",
              }))
          : [];
        const normalized: EstimateResponse = {
          subtotal: Number(data.subtotal) || 0,
          tax: Number(data.tax) || 0,
          currency: typeof data.currency === "string" ? data.currency : "eur",
          shippingOptions: normalizedOptions,
        };
        setEstimate(normalized);
        if (normalized.shippingOptions.length > 0) {
          const exists = selectedShip && normalized.shippingOptions.find((opt) => opt.id === selectedShip);
          const fallbackShip = exists ? selectedShip : normalized.shippingOptions[0].id;
          setSelectedShip(fallbackShip);
          persistAddress(fallbackShip);
        } else {
          setSelectedShip(null);
          persistAddress(null);
        }
      } catch (e: any) {
        setError(e.message || "estimate_failed");
      } finally {
        setLoading(false);
      }
    },
    [activeVariant, artworkId, country, normalizedQuantity, persistAddress, postal, selectedShip]
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ artworkId: string; variantId?: string | null }>).detail;
      if (!detail || detail.artworkId !== artworkId) {
        return;
      }
      const incomingVariant = typeof detail.variantId === "string" ? detail.variantId : null;
      setActiveVariant(incomingVariant);
      getEstimate(incomingVariant);
    };
    window.addEventListener("showEstimate", handler as EventListener);
    return () => {
      window.removeEventListener("showEstimate", handler as EventListener);
    };
  }, [artworkId, getEstimate]);

  const totalAmount = useMemo(() => {
    if (!estimate || !selectedShip) {
      return null;
    }
    const ship = estimate.shippingOptions.find((option) => option.id === selectedShip);
    const total = estimate.subtotal + estimate.tax + (ship?.amount || 0);
    return `${(total / 100).toFixed(2)} ${estimate.currency.toUpperCase()}`;
  }, [estimate, selectedShip]);

  return (
    <div className="mt-4 max-w-md rounded border p-3">
      <h3 className="mb-2 font-semibold">{t("checkout.estimate.title")}</h3>
      <div className="mb-2 flex gap-2">
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          onBlur={() => getEstimate()}
          className="w-24 rounded border px-2 py-1"
          placeholder={t("checkout.estimate.country_placeholder")}
        />
        <input
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          onBlur={() => getEstimate()}
          className="w-32 rounded border px-2 py-1"
          placeholder={t("checkout.estimate.postal_placeholder")}
        />
        <button
          type="button"
          onClick={() => getEstimate()}
          className="rounded bg-gray-100 px-3 py-1"
          disabled={loading}
        >
          {loading ? "…" : t("checkout.estimate.calc_btn")}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{t("checkout.estimate.error")}</p>}
      {estimate && (
        <div className="space-y-1 text-sm">
          <div>
            {t("checkout.estimate.subtotal")}: {(estimate.subtotal / 100).toFixed(2)}{" "}
            {estimate.currency.toUpperCase()}
          </div>
          <div>
            {t("checkout.estimate.tax")}: {(estimate.tax / 100).toFixed(2)} {estimate.currency.toUpperCase()}
          </div>
          <div>{t("checkout.estimate.shipping_options")}:</div>
          <ul className="pl-0">
            {estimate.shippingOptions.map((option) => (
              <li key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ship"
                  checked={selectedShip === option.id}
                  onChange={() => {
                    setSelectedShip(option.id);
                    persistAddress(option.id);
                  }}
                />
                <span>
                  {option.name}: {(option.amount / 100).toFixed(2)} {option.currency.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
          {totalAmount && (
            <div className="mt-1 font-medium">
              {t("checkout.estimate.total")}: {totalAmount}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-gray-500">{t("checkout.estimate.banner_note")}</p>
    </div>
  );
}
