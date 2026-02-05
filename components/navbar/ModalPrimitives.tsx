"use client";

import { useEffect, useRef } from "react";
import { m, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/i18n/provider";

const overlayBg = "var(--nav-overlay)";

const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalContentVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: 10 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 } as const,
  },
  exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.15 } },
};

type ModalContainerProps = {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function ModalContainer({ onClose, title, children }: ModalContainerProps) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    restoreEl.current = (document.activeElement as HTMLElement) || null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = contentRef.current;
      if (!container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusTimer = window.setTimeout(() => {
      const container = contentRef.current;
      if (!container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      (nodes[0] || container).focus();
    }, 0);

    document.addEventListener("keydown", trapTab);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", trapTab);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      restoreEl.current?.focus();
    };
  }, [onClose]);

  return (
    <m.div
      className="fixed inset-0 z-[60] flex py-6 px-4"
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="fixed inset-0" style={{ background: overlayBg }} onClick={onClose} aria-hidden="true" />
      <div className="flex h-full w-full items-center justify-center pointer-events-none">
        <m.div
          ref={contentRef}
          className="surface-card pointer-events-auto relative my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl"
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b p-4"
            style={{ background: "var(--surface-strong)", borderColor: "var(--surface-border-soft)" }}
          >
            <h2 id="modal-title" className="text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 transition-colors hover:bg-white/30 dark:hover:bg-white/10"
              style={{ color: "var(--icon-subtle)" }}
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-grow p-6">{children}</div>
        </m.div>
      </div>
    </m.div>
  );
}

type ModalSwitchLinkProps = {
  onSwitch: () => void;
  text: string;
  linkText: string;
};

export function ModalSwitchLink({ onSwitch, text, linkText }: ModalSwitchLinkProps) {
  return (
    <div className="mt-5 text-center text-sm text-[color:var(--text-body-subtle)]">
      <p>
        {text}{" "}
        <button
          onClick={onSwitch}
          className="font-medium text-[color:var(--color-accent)] transition-colors hover:text-[color:var(--color-accent-hover)]"
        >
          {linkText}
        </button>
      </p>
    </div>
  );
}
