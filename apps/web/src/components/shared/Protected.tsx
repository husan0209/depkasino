'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'

/**
 * Protected route (§19): прямой заход на защищённый URL отправляет на /login с возвратом.
 * Гость на витрине НЕ редиректится — там открывается LoginSheet при попытке запуска.
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    // Возврат на исходный URL (deep link) после логина.
    const next = `${window.location.pathname}${window.location.search}`
    router.replace(`/login?next=${encodeURIComponent(next)}`)
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="container-page mt-6 space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  return <>{children}</>
}
