"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";

type Variant = { id: string; name: string; priceOverride?: number | null; available: number };

type VariantSelectorProps = {
  variants?: Variant[];
  onChange: (variant: Variant | null) => void;
};

export default function VariantSelector({ variants = [], onChange }: VariantSelectorProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "");

  useEffect(() => {
    if (!variants.length) {
      setSelectedId("");
      onChange(null);
      return;
    }
    const fallback = variants.find((variant) => variant.available > 0) ?? variants[0];
    setSelectedId(fallback.id);
    onChange(fallback);
  }, [variants, onChange]);

  if (!variants.length) {
    return null;
  }

  const change = (id: string) => {
    setSelectedId(id);
    const variant = variants.find((item) => item.id === id) ?? null;
    onChange(variant);
  };

  return (
    <div className="mt-3 text-sm">
      <label className="mb-1 block text-gray-700">
        {t("artwork.variant_selector.label")}
      </label>
      <select className="w-full rounded border px-2 py-1" value={selectedId} onChange={(e) => change(e.target.value)}>
        {variants.map((variant) => (
          <option key={variant.id} value={variant.id} disabled={variant.available <= 0}>
            {variant.name} {variant.available <= 0 ? `(${t("artwork.variant_selector.sold_out")})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
