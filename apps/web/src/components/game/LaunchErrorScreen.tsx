'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Globe2, RefreshCw, ShieldAlert, Timer, Wallet, Wrench } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'

/** Каждой ошибке запуска — свой следующий шаг, никаких тупиков (§2.3 правило 9). */
const COPY: Record<
  string,
  { title: string; description: string; icon: React.ElementType; action: 'catalog' | 'deposit' | 'retry' | 'support' }
> = {
  region_unavailable: {
    title: 'Игра недоступна в вашем регионе',
    description: 'Провайдер ограничил доступ для вашей страны. В каталоге есть слоты, которые точно работают.',
    icon: Globe2,
    action: 'catalog'
  },
  provider_timeout: {
    title: 'Провайдер не ответил',
    description: 'Обычно это занимает пару секунд. Попробуйте запустить игру ещё раз.',
    icon: Timer,
    action: 'retry'
  },
  session_already_open: {
    title: 'Сессия этой игры уже открыта',
    description: 'Закройте предыдущее окно игры или подождите минуту — и запускайте заново.',
    icon: AlertTriangle,
    action: 'retry'
  },
  insufficient_funds: {
    title: 'На кошельке пусто',
    description: 'Пополните активный кошелёк — и вернётесь в игру сразу после зачисления.',
    icon: Wallet,
    action: 'deposit'
  },
  currency_not_supported: {
    title: 'Провайдер не принимает эту валюту',
    description: 'Тихая конвертация запрещена. Сыграйте с другого кошелька или выберите другую игру.',
    icon: Wallet,
    action: 'deposit'
  },
  maintenance: {
    title: 'Техработы у провайдера',
    description: 'Игра вернётся в течение часа. Пока можно зайти в другой слот.',
    icon: Wrench,
    action: 'catalog'
  },
  not_authenticated: {
    title: 'Нужно войти',
    description: 'Войдите или создайте аккаунт за 20 секунд — продолжите сразу после этого.',
    icon: ShieldAlert,
    action: 'retry'
  }
}

export function LaunchErrorScreen({ code, gameSlug }: { code: string; gameSlug?: string }) {
  const router = useRouter()
  const openDeposit = useUIStore((state) => state.openDeposit)
  const openLogin = useUIStore((state) => state.openLogin)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)

  const copy = COPY[code] ?? COPY.provider_timeout
  const Icon = copy.icon

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg-card p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
          <Icon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{copy.description}</p>

        <div className="mt-5 space-y-2">
          {copy.action === 'deposit' && (
            <Button
              variant="money"
              fullWidth
              size="lg"
              onClick={() => {
                openDeposit()
                router.push(gameSlug ? `/casino/${gameSlug}` : '/casino')
              }}
            >
              Пополнить {activeCurrency}
            </Button>
          )}

          {copy.action === 'retry' && (
            <Button
              fullWidth
              size="lg"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => (code === 'not_authenticated' ? openLogin() : router.back())}
            >
              {code === 'not_authenticated' ? 'Войти' : 'Попробовать снова'}
            </Button>
          )}

          <Button variant="secondary" fullWidth onClick={() => router.push('/casino')}>
            В каталог
          </Button>
          <Link href="/support" className="block pt-1 text-xs text-ink-muted hover:text-white">
            Написать в поддержку
          </Link>
        </div>
      </div>
    </div>
  )
}
