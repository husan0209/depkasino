'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

/** Tooltip — только десктоп (§3.1). На тач-устройствах не показывается. */
export function Tooltip({
  content,
  children,
  side = 'top',
  className
}: {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'right'
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  const position = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[side]

  return (
    <span
      className={cn('relative hidden lg:inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-xs animate-fade-in rounded-lg border border-line bg-bg-elevated px-2.5 py-1.5 text-xs text-ink shadow-card',
            position
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
