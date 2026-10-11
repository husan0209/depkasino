'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys, walletApi, kycApi, casinoApi, type TransactionFilters } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { isMock } from '@/lib/env'

/** Транзакции кошелька с фильтрами (§11). */
export function useTransactions(filters: TransactionFilters) {
  const userId = useAuthStore((state) => state.user?.id)
  return useQuery({
    queryKey: queryKeys.transactions(userId, filters as Record<string, unknown>),
    queryFn: () => walletApi.transactions(filters),
    enabled: !!userId
  })
}

/** KYC-статус и лимиты. Лимиты показываем в активной валюте (§13). */
export function useKycStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return useQuery({
    queryKey: queryKeys.kyc,
    queryFn: () => kycApi.status(),
    enabled: isAuthenticated
  })
}

/** Избранное: optimistic update (§18). */
export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => casinoApi.favorites(),
    enabled: !isMock ? true : true,
    staleTime: 60_000
  })
}

/** Last played для блока «Продолжить играть» (§6.1). */
export function useLastPlayed() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return useQuery({
    queryKey: queryKeys.lastPlayed,
    queryFn: () => casinoApi.lastPlayed(),
    enabled: isAuthenticated
  })
}

/** Популярные слоты как fallback пустых состояний (избранное, поиск). */
export function usePopularFallback() {
  return useQuery({
    queryKey: ['games', 'fallback-popular'] as const,
    queryFn: () => casinoApi.games({ sort: 'popular', pageSize: 6 }),
    staleTime: 300_000
  })
}

/** «Сейчас играют / крупные выигрыши» — контекстная полка, не live ticker (§16.2). */
export function useLiveFeed() {
  return useQuery({
    queryKey: queryKeys.feed,
    queryFn: () => casinoApi.feed(),
    staleTime: 60_000
  })
}
