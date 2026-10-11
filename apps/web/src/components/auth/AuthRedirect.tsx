'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useMounted } from '@/hooks/useMounted'

/** Авторизованный пользователь с /login и /register уходит на исходный deep link или на главную (§19). */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const mounted = useMounted()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    if (!mounted || isLoading || !isAuthenticated) return
    const next = new URLSearchParams(window.location.search).get('next')
    router.replace(next && next.startsWith('/') ? next : '/')
  }, [isAuthenticated, isLoading, mounted, router])

  return <>{children}</>
}
