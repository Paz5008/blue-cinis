import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ctaBase, ctaSizes, ctaVariants } from "./styles";

type Variant = keyof typeof ctaVariants;
type Size = keyof typeof ctaSizes;

type CtaLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  title?: string;
};

export default function CtaLink({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  title,
}: CtaLinkProps) {
  const classes = clsx(ctaBase, ctaSizes[size], ctaVariants[variant], className);
  return (
    <Link href={href} className={classes} title={title}>
      {children}
    </Link>
  );
}
