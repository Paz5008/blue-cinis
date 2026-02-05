"use client";

type VariantOption = {
    id: string;
    name: string;
    priceOverride?: number | null;
    available: number;
};

interface VariantSelectorProps {
    variants: VariantOption[];
    onChange: (variant: VariantOption) => void;
}

export default function VariantSelector({ variants, onChange }: VariantSelectorProps) {
    if (!variants || variants.length === 0) return null;

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Option
            </label>
            <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                    <button
                        key={variant.id}
                        onClick={() => onChange(variant)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:border-black transition-colors"
                    >
                        {variant.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
