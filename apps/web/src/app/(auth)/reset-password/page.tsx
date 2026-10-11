import type { Metadata } from 'next'
import { ResetPasswordClient } from '@/components/auth/ResetPasswordClient'

export const metadata: Metadata = { title: 'Новый пароль', robots: { index: false, follow: false } }

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return <ResetPasswordClient token={searchParams.token} />
}
