import React from 'react'
import clsx from 'clsx'

export type SubTitleProps = {
  as?: 'h2' | 'h3' | 'h4'
  className?: string
  children: React.ReactNode
}

export default function SubTitle({ as = 'h3', className, children }: SubTitleProps) {
  const Tag = as
  return (
    <Tag className={clsx('sub-title', className)}>{children}</Tag>
  )
}
