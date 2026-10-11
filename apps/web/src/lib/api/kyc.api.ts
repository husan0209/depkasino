import { http } from './client'
import type { KycState } from '@/types'

export interface KycSubmitPayload {
  firstName: string
  lastName: string
  birthDate: string
  country: string
  documentType: 'passport' | 'id_card'
  documentFileName: string
  selfieFileName: string
}

export const kycApi = {
  status: () => http.get<KycState>('/kyc'),
  submit: (payload: KycSubmitPayload) => http.post<KycState>('/kyc', payload)
}
