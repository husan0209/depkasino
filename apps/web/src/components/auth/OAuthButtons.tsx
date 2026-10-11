'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Button, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/lib/env'
import { http } from '@/lib/api/client'
import type { AuthResponse } from '@/lib/api/auth.api'

/**
 * Google и Telegram над email-формой (§5.1). Демо-креды в проде не показываем.
 *
 * Два режима:
 * - ключи выпущены (NEXT_PUBLIC_GOOGLE_CLIENT_ID / NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) —
 *   рисуются настоящие виджеты провайдеров, а их credential уходит в POST /auth/oauth,
 *   где бэкенд (Части 2–4) проверяет подпись/токен;
 * - ключей нет — демо-кнопки мока, чтобы фронт оставался проходимым без бэкенда.
 */
export function OAuthButtons({ onSuccess, compact = false }: { onSuccess?(): void; compact?: boolean }) {
  const oauth = useAuthStore((state) => state.oauth)
  const [pending, setPending] = useState<'google' | 'telegram' | null>(null)

  const handleMock = async (provider: 'google' | 'telegram') => {
    setPending(provider)
    try {
      await oauth(provider)
      onSuccess?.()
    } finally {
      setPending(null)
    }
  }

  /** Реальный провайдер прислал credential — обмениваем на сессию нашего бэкенда. */
  const handleCredential = async (provider: 'google' | 'telegram', credential: unknown) => {
    setPending(provider)
    try {
      const data = await http.post<AuthResponse>('/auth/oauth', { provider, credential })
      useAuthStore.setState({ user: data.user, isAuthenticated: true, isLoading: false })
      onSuccess?.()
    } finally {
      setPending(null)
    }
  }

  const realGoogle = env.googleClientId.length > 0
  const realTelegram = env.telegramBotUsername.length > 0

  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      {realGoogle ? (
        <GoogleWidget clientId={env.googleClientId} onCredential={(c) => void handleCredential('google', c)} busy={pending === 'google'} />
      ) : (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => void handleMock('google')}
          leftIcon={pending === 'google' ? <Spinner className="h-4 w-4" /> : <GoogleMark />}
          className="justify-center"
        >
          Google
        </Button>
      )}

      {realTelegram ? (
        <TelegramWidget botUsername={env.telegramBotUsername} onCredential={(c) => void handleCredential('telegram', c)} />
      ) : (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => void handleMock('telegram')}
          leftIcon={pending === 'telegram' ? <Spinner className="h-4 w-4" /> : <TelegramMark />}
          className="justify-center"
        >
          Telegram
        </Button>
      )}
    </div>
  )
}

/* ─────────────────────────── Google Identity Services ─────────────────────────── */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup' }): void
          renderButton(target: HTMLElement, options: { theme?: 'filled_black' | 'outline' | 'filled_blue'; size?: 'large' | 'medium'; width?: number; shape?: 'rectangular' | 'pill'; text?: 'signin_with' | 'continue_with' }): void
        }
      }
    }
    onTelegramAuth?: (user: unknown) => void
  }
}

function GoogleWidget({ clientId, onCredential, busy }: { clientId: string; onCredential(credential: string): void; busy: boolean }) {
  const holder = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential

  useEffect(() => {
    if (!window.google || !holder.current) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => cbRef.current(response.credential)
    })
    window.google.accounts.id.renderButton(holder.current, {
      theme: 'filled_blue',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: 320
    })
  }, [clientId])

  return (
    <div className="relative flex min-h-10 items-center justify-center">
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      <div ref={holder} className="w-full [&>div]:w-full" />
      {busy && <Spinner className="absolute h-4 w-4" />}
    </div>
  )
}

/* ─────────────────────────────── Telegram Login Widget ─────────────────────────────── */

function TelegramWidget({ botUsername, onCredential }: { botUsername: string; onCredential(user: unknown): void }) {
  const holder = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential

  useEffect(() => {
    const node = holder.current
    if (!node) return
    // Колбэк виджета задаётся именем глобальной функции — вешаем её до загрузки скрипта.
    window.onTelegramAuth = (user) => cbRef.current(user)
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    node.appendChild(script)
    return () => {
      node.replaceChildren()
      delete window.onTelegramAuth
    }
  }, [botUsername])

  return <div ref={holder} className="flex min-h-10 items-center justify-center" />
}

/* ─────────────────────────────────── марки демо-кнопок ───────────────────────────────── */

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1A6.2 6.2 0 0 1 12 5.8c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12Z" />
    </svg>
  )
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <circle cx="12" cy="12" r="11" fill="#2AABEE" />
      <path fill="#fff" d="m6.5 12.1 10.2-4c.5-.2 1 .1.8.9l-1.7 8c-.1.5-.5.7-.9.4l-2.5-1.9-1.2 1.2c-.2.2-.4.3-.7.3l.3-2.6 4.7-4.2c.2-.2 0-.3-.3-.1l-5.8 3.6-2.6-.8c-.6-.2-.6-.6.1-.9Z" />
    </svg>
  )
}
