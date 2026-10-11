'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui'

/**
 * Граница ошибок для всего приложения (§23 блок I).
 *
 * Правило раздела: сбой не должен превращаться в белый экран и не должен «схлопывать»
 * все ошибки в один текст. Кнопка «Повторить» перерисовывает сегмент, не теряя адрес,
 * а код обращения помогает поддержке найти случай в логах.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // В консоль — детали, в интерфейс — человеческий текст без стектрейса.
    console.error('[app] необработанная ошибка:', error)
  }, [error])

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-white">Экран не открылся</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Это сбой на нашей стороне, ваши балансы и заявки не пострадали. Попробуйте ещё раз — чаще всего помогает сразу.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} leftIcon={<RotateCw className="h-4 w-4" />}>
          Повторить
        </Button>
        <Link
          href="/casino"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-bg-secondary px-5 text-sm font-semibold text-ink transition-colors hover:text-white"
        >
          В каталог
        </Link>
      </div>

      {error.digest && <p className="mt-4 text-2xs text-ink-dim">Код обращения: {error.digest}</p>}
    </div>
  )
}
