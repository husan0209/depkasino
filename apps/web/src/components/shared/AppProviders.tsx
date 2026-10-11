'use client'

import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastViewport } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { useGeoStore } from '@/stores/geo'

/**
 * Провайдеры приложения: TanStack Query (§18) + бутстрап сессии.
 * AuthProvider при старте делает fetchMe, при истечении токена — refresh (в axios-интерсепторе),
 * при провале — очистка стора (§19).
 */
function SessionBootstrap() {
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)
  const fetchGeo = useGeoStore((state) => state.fetchGeo)
  const fetchWallets = useWalletStore((state) => state.fetchWallets)
  const refreshActive = useWalletStore((state) => state.refreshActive)
  const resetWallet = useWalletStore((state) => state.reset)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void fetchGeo()
    void fetchMe()
  }, [fetchGeo, fetchMe])

  useEffect(() => {
    if (isAuthenticated) void fetchWallets()
    else resetWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId])

  useEffect(() => {
    const onFocus = () => {
      if (useAuthStore.getState().isAuthenticated) void refreshActive()
    }
    const onUnauthorized = () => {
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false })
      resetWallet()
    }
    // Баланс обновляем по фокусу окна — Socket.IO в этой части не подключаем (§2.1).
    window.addEventListener('focus', onFocus)
    window.addEventListener('dk:unauthorized', onUnauthorized)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('dk:unauthorized', onUnauthorized)
    }
  }, [refreshActive, resetWallet])

  return null
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      {children}
      <ToastViewport />
    </QueryClientProvider>
  )
}
