import CtaLink from "@/components/shared/cta/CtaLink";
import clsx from "clsx";
import type { ReactNode } from "react";

type HeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  alignment?: "center" | "left";
  actions?: HeroAction[];
  subtitle?: ReactNode;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  alignment = "center",
  actions = [],
  subtitle,
}: PageHeroProps) {
  const isCentered = alignment === "center";

  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(196,140,58,0.28),transparent_62%),radial-gradient(circle_at_85%_15%,rgba(76,106,87,0.22),transparent_68%),linear-gradient(115deg,rgba(16,10,6,0.82)0%,rgba(19,12,7,0.55)48%,rgba(0,0,0,0.2)82%)]" />
        <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: "var(--gradient-artist-pattern)" }} />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "var(--texture-noise)" }} />
      </div>

      <div
        className={clsx(
          "relative z-10 section-container",
          "py-20 md:py-28",
          isCentered ? "text-center" : "text-left",
        )}
      >
        <div className={clsx("mx-auto", isCentered ? "max-w-3xl" : "max-w-4xl ml-0")}>
          {eyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.26em] text-white/80 backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden="true" />
              {eyebrow}
            </p>
          )}

          <h1 className="mt-6 font-playfair text-4xl font-semibold leading-tight text-white md:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="mt-5 text-base text-white/80 md:text-lg">
              {description}
            </p>
          )}

          {subtitle && (
            <div className="mt-8 text-sm text-white/70 md:text-base">
              {subtitle}
            </div>
          )}

          {actions.length > 0 && (
            <div
              className={clsx(
                "mt-10 flex flex-wrap gap-3",
                isCentered ? "justify-center" : "justify-start",
              )}
            >
              {actions.map((action) => (
                <CtaLink
                  key={action.href}
                  href={action.href}
                  variant={action.variant ?? "primary"}
                  size="lg"
                  className={clsx(
                    action.variant === "secondary" && "bg-white/5 text-white hover:bg-white/10",
                    action.variant === "ghost" && "text-white/80 hover:bg-white/10"
                  )}
                >
                  {action.label}
                </CtaLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
