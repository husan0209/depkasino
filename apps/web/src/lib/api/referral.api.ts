import { http } from './client'
import type { Currency, ReferralEntry } from '@/types'

export interface ReferralOverview {
  code: string
  total: number
  active: number
  earned: Partial<Record<Currency, number>>
  available: Partial<Record<Currency, number>>
  items: ReferralEntry[]
}

export const referralApi = {
  overview: () => http.get<ReferralOverview>('/referral'),
  withdraw: (currency: Currency, amount: number) => http.post<{ ok: boolean }>('/referral/withdraw', { currency, amount })
}
