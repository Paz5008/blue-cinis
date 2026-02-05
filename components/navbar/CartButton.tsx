"use client";

import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useI18n } from "@/i18n/provider";

type CartButtonProps = {
  count?: number;
};

export default function CartButton({ count = 0 }: CartButtonProps) {
  const { t } = useI18n();
  const label = translate(t, "nav.cart", "Sélection");
  const title = translate(t, "nav.your_cart", "Votre sélection");

  return (
    <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
      <Link href="/selection" className="nav-control relative" aria-label={label} title={title}>
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        <AnimatePresence>{count > 0 ? <CartCountBadge count={count} /> : null}</AnimatePresence>
      </Link>
    </m.div>
  );
}

function CartCountBadge({ count }: { count: number }) {
  return (
    <m.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
    >
      {count}
    </m.span>
  );
}

function translate(
  t: (key: string) => string,
  key: string,
  fallback: string,
) {
  const value = t(key);
  return value === key ? fallback : value;
}
