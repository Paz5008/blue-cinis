export const ctaBase =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900";

export const ctaSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
} as const;

export const ctaVariants = {
  primary:
    "bg-[color:var(--color-accent)] text-[color:var(--color-accent-contrast)] hover:bg-[color:var(--color-accent-hover)]",
  secondary:
    "border border-[color:var(--surface-border-soft)] text-[color:var(--color-text-heading)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
  ghost: "text-[color:var(--color-text-heading)] hover:text-[color:var(--color-accent)]",
} as const;
