"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartButton({ count }: { count: number }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="nav-control relative" aria-label="Panier">
                <ShoppingBag className="h-5 w-5" />
            </button>
        );
    }

    return (
        <Link href="/panier" className="nav-control relative" aria-label={`Panier (${count})`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white">
                    {count}
                </span>
            )}
        </Link>
    );
}
