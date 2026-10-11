'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, History, Home, LayoutGrid, LifeBuoy, SlidersHorizontal, Wallet } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Tooltip } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * Десктоп: узкая икон-панель 64–72px, подписи по hover (§4.5).
 * Никаких Live / Настольные / Быстрые / Бонусы заранее.
 */
const items = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/casino', label: 'Казино', icon: LayoutGrid },
  { href: '/favorites', label: 'Избранное', icon: Heart },
  { href: '/providers', label: 'Провайдеры', icon: SlidersHorizontal },
  { href: '/wallet', label: 'Кошелёк', icon: Wallet },
  { href: '/history', label: 'История', icon: History },
  { href: '/support', label: 'Поддержка', icon: LifeBuoy }
] as const

export function DesktopRail() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[72px] flex-col items-center gap-1 border-r border-line/70 bg-bg-primary/95 py-4 backdrop-blur md:flex">
      <Link href="/" aria-label="На главную" className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-accent">
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-white">
          <path d="M12 2 3 6.5v6.2c0 4.6 3.4 8 9 9.3 5.6-1.3 9-4.7 9-9.3V6.5L12 2Z" fill="currentColor" opacity="0.9" />
          <path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6L12 7Z" fill="#0F0F1A" />
        </svg>
      </Link>
      <nav aria-label="Навигация" className="flex flex-col items-center gap-1">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Tooltip key={item.href} content={item.label} side="right">
              <Link href={item.href} aria-label={item.label} data-active={active} className={cn('rail-item')}>
                <Icon className="h-5 w-5" />
              </Link>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}
