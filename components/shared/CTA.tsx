"use client";

import Link from "next/link";
import clsx from "clsx";
import { ctaBase, ctaSizes, ctaVariants } from "./cta/styles";

type Variant = "primary" | "secondary" | "ghost";

interface CTAProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function CTA({ href, onClick, children, className, variant = "primary", size = "md", title, type = 'button' }: CTAProps) {
  const classes = clsx(ctaBase, ctaSizes[size], ctaVariants[variant], className);
  if (href) {
    return (
      <Link href={href} className={classes} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} title={title}>
      {children}
    </button>
  );
}
