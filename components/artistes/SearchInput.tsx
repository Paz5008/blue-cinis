"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { m } from "framer-motion";

interface SearchInputProps {
    className?: string;
}

export default function SearchInput({ className = "" }: SearchInputProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [value, setValue] = useState(searchParams.get("search") || "");

    // Debounced URL update
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (value.trim()) {
                params.set("search", value.trim());
                params.set("page", "1"); // Reset to first page on search
            } else {
                params.delete("search");
            }

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }, 300);

        return () => clearTimeout(timer);
    }, [value, pathname, router, searchParams]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    }, []);

    const handleClear = useCallback(() => {
        setValue("");
    }, []);

    return (
        <m.div
            className={`relative ${className}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Search Icon */}
            <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>

            <input
                type="search"
                value={value}
                onChange={handleChange}
                placeholder="Rechercher un artiste..."
                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 
                           focus:outline-none focus:border-blue-500/50 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20
                           transition-all duration-200"
                aria-label="Rechercher un artiste par nom ou style"
            />

            {/* Clear Button */}
            {value && (
                <m.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full"
                    aria-label="Effacer la recherche"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </m.button>
            )}
        </m.div>
    );
}
