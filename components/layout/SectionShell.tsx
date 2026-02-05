import clsx from "clsx";
import type { ReactNode } from "react";

interface SectionShellProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  overlay?: boolean;
  overlayVariant?: "accent" | "mesh";
  id?: string;
}

export default function SectionShell({
  children,
  className,
  containerClassName,
  overlay = false,
  overlayVariant = "accent",
  id,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={clsx("section-shell", overlay && "home-section", className)}
    >
      {overlay && (
        <div
          className="section-overlay"
          data-variant={overlayVariant === "mesh" ? "mesh" : undefined}
          aria-hidden="true"
        >
          <div className="section-overlay__layer" data-layer="glow" />
          <div className="section-overlay__layer" data-layer="veil" />
        </div>
      )}
      <div className={clsx("section-container relative z-10", containerClassName)}>
        {children}
      </div>
    </section>
  );
}