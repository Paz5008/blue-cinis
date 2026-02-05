"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";
import { SectionTitle, BodyText } from "../typography";
import type { SectionTitleProps } from "../typography";

type Alignment = "center" | "start";
type DividerAlign = "center" | "start" | "end";

export interface HomeSectionHeaderProps {
  badge?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  alignment?: Alignment;
  badgeVariant?: "default" | "accent";
  divider?: boolean;
  dividerAlign?: DividerAlign;
  titleAs?: SectionTitleProps["as"];
  className?: string;
  badgeClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
}

export default function HomeSectionHeader({
  badge,
  title,
  subtitle,
  alignment = "center",
  badgeVariant = "default",
  divider = false,
  dividerAlign,
  titleAs,
  className,
  badgeClassName,
  titleClassName,
  subtitleClassName,
  children,
}: HomeSectionHeaderProps) {
  const isCenter = alignment === "center";
  const isAccent = badgeVariant === "accent";
  const containerClasses = clsx(
    "flex flex-col gap-4",
    isCenter ? "items-center text-center" : "items-start text-left",
    className
  );



  const badgeClasses = clsx(
    "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] transition-colors",
    isAccent
      ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent)]"
      : "border-[color:var(--surface-border-soft)]/70 bg-white/60 text-[color:var(--color-text-body-subtle)] dark:border-white/10 dark:bg-white/5 dark:text-white/70",
    badgeClassName
  );

  const badgeDotClasses = clsx(
    "inline-flex h-1.5 w-1.5 rounded-full",
    isAccent
      ? "bg-[color:var(--color-accent)] shadow-[0_0_12px_rgba(99,102,241,0.55)]"
      : "bg-[color:var(--color-text-body-subtle)]/70 dark:bg-white/60"
  );

  const subtitleClasses = clsx(
    "text-[color:var(--color-text-body)]",
    isCenter ? "mx-auto max-w-2xl" : "max-w-xl",
    subtitleClassName
  );

  const dividerBase = "h-px w-16 bg-[color:var(--color-surface-border-soft)]";

  const dividerPlacement: DividerAlign = dividerAlign ?? (isCenter ? "center" : "start");

  return (
    <m.header
      className={containerClasses}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
    >
      {badge ? (
        <span className={badgeClasses}>
          <span className={badgeDotClasses} aria-hidden="true" />
          {badge}
        </span>
      ) : null}

      <SectionTitle
        as={titleAs ?? "h2"}
        className={clsx(
          "text-[color:var(--color-text-heading)]",
          titleClassName
        )}
      >
        {title}
      </SectionTitle>

      {divider ? (
        <span
          className={clsx(
            dividerBase,
            dividerPlacement === "center" && "mx-auto",
            dividerPlacement === "start" && "mr-auto",
            dividerPlacement === "end" && "ml-auto",
            badgeVariant === "accent" && "bg-[color:var(--color-accent)]/40"
          )}
        />
      ) : null}

      {subtitle ? (
        <BodyText as="p" className={subtitleClasses}>
          {subtitle}
        </BodyText>
      ) : null}

      {children}
    </m.header>
  );
}
