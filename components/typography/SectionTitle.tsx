import React from 'react'
import clsx from 'clsx'

export type SectionTitleProps = {
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  children: React.ReactNode
}

export default function SectionTitle({ as = 'h2', className, children }: SectionTitleProps) {
  const Tag = as
  return (
    <Tag className={clsx('section-title', className)}>{children}</Tag>
  )
}
