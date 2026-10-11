import Link from 'next/link'
import { cn } from '@/lib/cn'

/** Капс-лейбл секции + человеческий заголовок (§3 тональность). */
export function SectionHeading({
  label,
  title,
  href,
  hrefLabel = 'Все',
  className
}: {
  label: string
  title: string
  href?: string
  hrefLabel?: string
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <p className="section-label">{label}</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm text-accent transition-colors hover:text-accent-hover">
          {hrefLabel} →
        </Link>
      )}
    </div>
  )
}
