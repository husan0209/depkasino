import { http } from './client'
import type { Currency, PaymentNetwork } from '@/types'

export interface DepositIntent {
  id: string
  kind: 'deposit' | 'withdraw'
  currency: Currency
  amount: number
  method: string
  network?: PaymentNetwork
  address?: string
  deadline?: string
  status?: 'pending' | 'completed' | 'failed'
}

export interface WithdrawRequest {
  currency: Currency
  amount: number
  methodId: string
  destination?: string
}

export const paymentsApi = {
  createDeposit: (payload: { currency: Currency; amount: number; methodId: string }) =>
    http.post<DepositIntent>('/payments/deposit', payload),
  depositStatus: (id: string) => http.get<DepositIntent>(`/payments/${id}`),
  createWithdrawal: (payload: WithdrawRequest) => http.post<{ id: string; status: string }>('/payments/withdraw', payload)
}
