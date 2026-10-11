import { http } from './client'
import type { Paginated, Transaction, WalletBalance } from '@/types'

export interface TransactionFilters {
  currency?: string
  type?: string
  period?: string
  page?: number
  pageSize?: number
}

export const walletApi = {
  list: () => http.get<WalletBalance[]>('/wallet'),
  transactions: (filters: TransactionFilters) =>
    http.get<Paginated<Transaction>>('/wallet/transactions', { ...filters } as Record<string, unknown>)
}
