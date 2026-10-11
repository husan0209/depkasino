import type { Metadata } from 'next'
import { ForgotPasswordClient } from '@/components/auth/ForgotPasswordClient'

export const metadata: Metadata = { title: 'Восстановление пароля', robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
