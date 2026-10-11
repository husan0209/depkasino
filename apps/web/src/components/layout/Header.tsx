'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  FileClock,
  History,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  User as UserIcon,
  Wallet
} from 'lucide-react'
import { Avatar, Button, CurrencyAmount, SearchInput } from '@/components/ui'
import { Logo } from '@/components/shared/Logo'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'
import { useMounted } from '@/hooks/useMounted'
import { SESSION_HINT_ATTR } from '@/lib/session-hint'
import { cn } from '@/lib/cn'

/**
 * Sticky header в двух состояниях (§4.2, §4.1 Части 5.1).
 * Гость: лого + «Войти» + акцентная «Регистрация».
 * Свой: лого · активный баланс ▾ · зелёная «+» · аватар.
 * Деньги всегда в одном месте: одна активная сумма и зелёная кнопка пополнения.
 */
export function Header() {
  const mounted = useMounted()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const authLoading = useAuthStore((state) => state.isLoading)
  const logout = useAuthStore((state) => state.logout)
  const openLogin = useUIStore((state) => state.openLogin)
  const openDeposit = useUIStore((state) => state.openDeposit)
  const openWalletSwitcher = useUIStore((state) => state.openWalletSwitcher)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const activeWallet = useWalletStore((state) => state.getActiveWallet())

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Подсказка сессии из <html>: токен есть, но /me ещё не ответил — не показываем чужому «Войти».
  const [sessionPlayer, setSessionPlayer] = useState(false)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const submitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      setSearchOpen(false)
    },
    [router]
  )

  // Поиск в хедере на десктопе + Ctrl/⌘ K (§4.4).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setSessionPlayer(document.documentElement.getAttribute(SESSION_HINT_ATTR) === 'player')
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const showBalance = mounted && isAuthenticated && !!activeWallet
  // Пока стор не знает роль, а токен уже есть — держим нейтральный скелет вместо гостевых кнопок.
  const pendingPlayer = mounted && !isAuthenticated && sessionPlayer && authLoading
  const kycBlocks = !!user?.withdrawalBlockedByKyc

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg-primary/92 backdrop-blur-md">
      <div className="container-page flex h-14 items-center gap-3 md:h-16">
        <Logo className="shrink-0 lg:hidden" />

        {/* Десктоп: поиск в хедере */}
        <div className="hidden min-w-0 flex-1 md:flex lg:max-w-md">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={submitSearch}
            placeholder="Игры и провайдеры"
            className="h-10 w-full"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Телефон: кнопка поиска */}
          <button
            type="button"
            aria-label="Поиск"
            onClick={() => setSearchOpen(true)}
            className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-bg-secondary hover:text-white md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {!mounted || pendingPlayer ? (
            <div className="h-9 w-24 rounded-xl bg-bg-secondary/60" aria-hidden />
          ) : showBalance ? (
            <>
              <button
                type="button"
                onClick={openWalletSwitcher}
                aria-label="Кошелёк: сменить активный"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-bg-secondary px-3 transition-colors hover:border-accent/50"
              >
                <CurrencyAmount amount={activeWallet.balance} currency={activeCurrency} context="header" className="text-sm font-semibold" />
                <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
              </button>

              <Button
                variant="money"
                size="sm"
                onClick={() => openDeposit()}
                aria-label="Пополнить"
                className="h-9 w-9 rounded-full px-0 sm:w-auto sm:rounded-xl sm:px-3"
              >
                <Plus className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Пополнить</span>
              </Button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-label="Меню аккаунта"
                  aria-expanded={menuOpen}
                  className="rounded-full ring-offset-bg-primary transition-shadow hover:ring-2 hover:ring-accent/50"
                >
                  <Avatar name={user?.firstName ?? user?.email} src={user?.avatarUrl} size="md" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 w-60 animate-scale-in overflow-hidden rounded-2xl border border-line bg-bg-elevated shadow-card">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{user?.firstName ?? 'Игрок'}</p>
                      <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                    </div>
                    <nav className="p-1.5">
                      <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />} label="Профиль" onClick={() => setMenuOpen(false)} />
                      <MenuLink href="/wallet" icon={<Wallet className="h-4 w-4" />} label="Мои кошельки" onClick={() => setMenuOpen(false)} />
                      <MenuLink href="/history" icon={<History className="h-4 w-4" />} label="История игр" onClick={() => setMenuOpen(false)} />
                      <MenuLink href="/profile/settings" icon={<Settings className="h-4 w-4" />} label="Настройки" onClick={() => setMenuOpen(false)} />
                      {/* KYC виден только если статус блокирует вывод или лимит (§4.2) */}
                      {kycBlocks && (
                        <MenuLink href="/kyc" icon={<ShieldAlert className="h-4 w-4" />} label="Пройти верификацию" onClick={() => setMenuOpen(false)} highlight />
                      )}
                    </nav>
                    <div className="border-t border-line p-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setMenuOpen(false)
                          await logout()
                          router.push('/')
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-bg-secondary hover:text-white"
                      >
                        <LogOut className="h-4 w-4" /> Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => openLogin()} className="px-2.5">
                Войти
              </Button>
              <Button size="sm" onClick={() => router.push('/register')} className="px-3">
                Регистрация
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Телефон: поле поиска под шапкой (§4.4) */}
      <div className="container-page pb-2 lg:hidden">
        <Link
          href="/search"
          className="flex h-10 items-center gap-2 rounded-xl border border-line bg-bg-secondary px-3 text-sm text-ink-dim transition-colors hover:border-accent/50"
        >
          <Search className="h-4 w-4" />
          Поиск игр и провайдеров
        </Link>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] hidden animate-fade-in bg-black/70 md:block" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto mt-24 w-full max-w-xl px-4" onClick={(event) => event.stopPropagation()}>
            <SearchInput value={query} onChange={setQuery} onSubmit={submitSearch} autoFocus />
            <p className="mt-3 text-center text-xs text-ink-muted">
              Esc — закрыть. Показываем игры и провайдеров.
            </p>
          </div>
        </div>
      )}
    </header>
  )
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
  highlight = false
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick(): void
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-bg-secondary',
        highlight ? 'text-warning' : 'text-ink-muted hover:text-white'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
