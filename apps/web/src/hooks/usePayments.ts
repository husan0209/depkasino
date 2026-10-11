'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, queryKeys, type DepositIntent, type WithdrawRequest } from '@/lib/api'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import type { Currency } from '@/types'

/** Создание депозита: фиатный PSP или крипто-адрес (§10.2). */
export function useCreateDeposit() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const setLastPaymentMethod = useWalletStore((state) => state.setLastPaymentMethod)

  return useMutation({
    mutationFn: (payload: { currency: Currency; amount: number; methodId: string }) => paymentsApi.createDeposit(payload),
    onSuccess: (_data, variables) => {
      setLastPaymentMethod(variables.methodId)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId, {}) })
    }
  })
}

/**
 * Polling статуса платежа: WebSocket в этой части не подключаем (§2.1).
 * Опрашиваем, пока платёж не завершится, и обновляем конкретный кошелёк.
 */
export function useDepositStatus(id: string | null, options?: { onCompleted?(intent: DepositIntent): void; enabled?: boolean }) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['payments', id],
    enabled: !!id && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data as DepositIntent | undefined
      if (!data) return 2500
      return data.status === 'pending' ? 2500 : false
    },
    queryFn: async () => {
      const intent = await paymentsApi.depositStatus(id as string)
      if (intent.status === 'completed') {
        // Обновляем конкретный кошелёк, а не всё приложение (§17).
        await queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
        options?.onCompleted?.(intent)
      }
      return intent
    }
  })
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (payload: WithdrawRequest) => paymentsApi.createWithdrawal(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId, {}) })
      toast.success('Заявка создана', 'Статус видно в истории транзакций')
    }
  })
}
