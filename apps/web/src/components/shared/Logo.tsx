import Link from 'next/link'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'

/** Логотип: один бренд, один знак (§2.3 правило 12). */
export function Logo({
  className,
  withTagline = false,
  linked = true
}: {
  className?: string
  withTagline?: boolean
  /** false — когда ссылку даёт родитель: <a> внутри <a> ломает гидратацию. */
  linked?: boolean
}) {
  const inner = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent shadow-lift">
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 text-white">
          <path d="M12 2 3 6.5v6.2c0 4.6 3.4 8 9 9.3 5.6-1.3 9-4.7 9-9.3V6.5L12 2Z" fill="currentColor" opacity="0.9" />
          <path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6L12 7Z" fill="#0F0F1A" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight text-white">{env.siteName}</span>
        {withTagline && <span className="mt-0.5 text-2xs text-ink-muted">слоты и живые выигрыши</span>}
      </span>
    </>
  )
  const classNameFull = cn('inline-flex items-center gap-2', className)

  if (!linked) {
    return (
      <span className={classNameFull} aria-label={`${env.siteName} — на главную`}>
        {inner}
      </span>
    )
  }
  return (
    <Link href="/" aria-label={`${env.siteName} — на главную`} className={classNameFull}>
      {inner}
    </Link>
  )
}
