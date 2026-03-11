"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowUp } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/i18n/provider";

type BackToTopVariant = "floating" | "footer";

interface BackToTopButtonProps {
  variant?: BackToTopVariant;
  className?: string;
}

export default function BackToTopButton({
  variant = "floating",
  className,
}: BackToTopButtonProps) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const label = useMemo(() => {
    if (!t) {
      return "Retour en haut";
    }
    const value = t("common.back_to_top");
    return value && value !== "common.back_to_top" ? value : "Retour en haut";
  }, [t]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (variant === "footer") {
    if (!isVisible) {
      return null;
    }

    return (
      <m.button
        type="button"
        onClick={scrollToTop}
        aria-label={label}
        className={clsx(
          "group inline-flex items-center gap-2 rounded-full border border-[color:var(--surface-border-soft)]/70 bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--color-text-heading)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] dark:border-white/20 dark:bg-night/50 dark:text-white",
          className
        )}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{label}</span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] transition group-hover:bg-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-contrast)]">
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </m.button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible ? (
        <m.button
          key="back-to-top-floating"
          type="button"
          onClick={scrollToTop}
          aria-label={label}
          className={clsx(
            "fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-contrast)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-glass-lg focus-within:-translate-y-1.5 focus-within:shadow-glass-lg hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40",
            className
          )}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </m.button>
      ) : null}
    </AnimatePresence>
  );
}
