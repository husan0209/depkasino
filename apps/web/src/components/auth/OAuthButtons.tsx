'use client'

import { Button, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'

/** Google и Telegram над email-формой (§5.1). Демо-креды в проде не показываем. */
export function OAuthButtons({ onSuccess, compact = false }: { onSuccess?(): void; compact?: boolean }) {
  const oauth = useAuthStore((state) => state.oauth)

  const handle = async (provider: 'google' | 'telegram') => {
    await oauth(provider)
    onSuccess?.()
  }

  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => handle('google')}
        leftIcon={<GoogleMark />}
        className="justify-center"
      >
        Google
      </Button>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => handle('telegram')}
        leftIcon={<TelegramMark />}
        className="justify-center"
      >
        Telegram
      </Button>
    </div>
  )
}

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
