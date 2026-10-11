import { cn } from '@/lib/cn'
import type { GameBadge as GameBadgeType } from '@/types'

/**
 * Один бейдж на карточку: NEW или HOT, никогда оба (§2 правило 1).
 */
export function Badge({
  children,
  variant = 'neutral',
  className
}: {
  children: React.ReactNode
  variant?: 'neutral' | 'new' | 'hot' | 'success' | 'warning' | 'danger' | 'network'
  className?: string
}) {
  const variants = {
    neutral: 'bg-bg-secondary text-ink-muted border-line',
    new: 'bg-accent text-white border-accent',
    hot: 'bg-danger text-white border-danger',
    success: 'bg-money/15 text-money border-money/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    network: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30'
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function GameBadge({ badge, className }: { badge?: GameBadgeType; className?: string }) {
  if (!badge) return null
  return (
    <Badge variant={badge === 'NEW' ? 'new' : 'hot'} className={className}>
      {badge}
    </Badge>
  )
}

/** Тег сети крипты: TRC20 / Bitcoin — бирюзовый, сеть видна всегда (§4.1). */
export function NetworkTag({ network, className }: { network?: string; className?: string }) {
  if (!network) return null
  const label = network === 'BTC' ? 'Bitcoin' : network
  return (
    <Badge variant="network" className={className}>
      {label}
    </Badge>
  )
}
