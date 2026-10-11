'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, LayoutGrid, User } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { useMounted } from '@/hooks/useMounted'
import { cn } from '@/lib/cn'

/**
 * Таб-бар только < 768px (§4.3). Кошелька здесь нет — он уже в шапке.
 * Никаких сокращений: «Избранное», не «Избр.».
 * У залогиненного в табе «Профиль» — реальная аватарка (§4.4 Части 5.1).
 */
const items = [
  { href: '/', label: 'Главная', icon: Home, match: (path: string) => path === '/' },
  { href: '/casino', label: 'Казино', icon: LayoutGrid, match: (path: string) => path.startsWith('/casino') || path.startsWith('/providers') },
  { href: '/favorites', label: 'Избранное', icon: Heart, match: (path: string) => path.startsWith('/favorites') },
  { href: '/profile', label: 'Профиль', icon: User, match: (path: string) => path.startsWith('/profile') || path.startsWith('/wallet') || path.startsWith('/kyc') }
] as const

export function BottomNav() {
  const pathname = usePathname()
  const mounted = useMounted()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-bg-primary/95 pb-safe-b backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname)
          const isProfile = item.href === '/profile'
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
                  active ? 'text-accent' : 'text-ink-muted'
                )}
              >
                {isProfile && mounted && isAuthenticated ? (
                  <Avatar name={user?.firstName ?? user?.email} src={user?.avatarUrl} size="xs" className={cn(active && 'ring-2 ring-accent')} />
                ) : isProfile ? (
                  /* Роль ещё не разрешена: гостю — иконка, «своему» — нейтральное место под аватарку (без вспышки). */
                  <>
                    <span data-visibility="guest" className="flex h-5 w-5 items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span data-visibility="player" aria-hidden className="h-5 w-5 rounded-full bg-bg-secondary" />
                  </>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
