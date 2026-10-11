'use client'

import Link from 'next/link'
import { Sheet } from '@/components/ui'
import { LoginForm } from './LoginForm'
import { useUIStore } from '@/stores/ui'
import { useLaunchStore } from '@/stores/launch'
import { useLaunch } from '@/hooks/useLaunch'
import { useWalletStore } from '@/stores/wallet'

/**
 * LoginSheet (§5.5): «Войдите, чтобы играть».
 * После успеха — сразу продолжить launch, не выкидывать на главную.
 */
export function LoginSheet() {
  const open = useUIStore((state) => state.loginSheet)
  const closeLogin = useUIStore((state) => state.closeLogin)
  const pending = useLaunchStore((state) => state.pending)
  const clearPending = useLaunchStore((state) => state.clearPending)
  const { continueAfterLogin } = useLaunch()
  const fetchWallets = useWalletStore((state) => state.fetchWallets)

  const pendingGame = pending?.decision.kind === 'login' ? pending.game : null

  const handleClose = () => {
    clearPending()
    closeLogin()
  }

  const handleSuccess = async () => {
    closeLogin()
    // Подтягиваем кошельки, затем продолжаем прерванный launch.
    await fetchWallets()
    if (pendingGame) continueAfterLogin(pendingGame)
    else clearPending()
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={pendingGame ? 'Войдите, чтобы играть' : 'Вход'}
      subtitle={pendingGame ? `${pendingGame.title} — продолжим сразу после входа` : undefined}
      footer={
        <p className="text-center text-sm text-ink-muted">
          Нет аккаунта?{' '}
          <Link href="/register" onClick={handleClose} className="font-semibold text-accent hover:text-accent-hover">
            Регистрация за 20 секунд
          </Link>
        </p>
      }
    >
      <LoginForm onSuccess={handleSuccess} />
    </Sheet>
  )
}
