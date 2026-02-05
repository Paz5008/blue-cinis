import React from 'react'
import clsx from 'clsx'

export type BodyTextProps = React.HTMLAttributes<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement> & {
  as?: 'p' | 'span' | 'div'
  className?: string
  children: React.ReactNode
}

export default function BodyText({ as = 'p', className, children, ...rest }: BodyTextProps) {
  const Tag = as as any
  return (
    <Tag className={clsx('body-text', className)} {...rest}>{children}</Tag>
  )
}
