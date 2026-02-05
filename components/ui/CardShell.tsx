import React from 'react';
import clsx from 'clsx';
import { cardBase, cardVariants } from "@/components/home/cardStyles";

export const cardShellBase = `${cardBase} overflow-hidden transition`;

export type CardShellProps<T extends React.ElementType = 'div'> = {
  as?: T
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export default function CardShell<T extends React.ElementType = 'div'>({
  as,
  className,
  children,
  ...rest
}: CardShellProps<T>) {
  const Tag = (as || 'div') as any
  return (
    <Tag className={clsx(cardShellBase, className)} {...rest}>
      {children}
    </Tag>
  )
}
