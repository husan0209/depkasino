import type { Metadata } from 'next'
import { VerifyEmailClient } from '@/components/auth/VerifyEmailClient'

export const metadata: Metadata = { title: 'Подтверждение email', robots: { index: false, follow: false } }

/** Автозапрос по токену из письма: успех — «Email подтверждён», ошибка — причина и «отправить ещё раз» (§5.3). */
export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  return <VerifyEmailClient token={searchParams.token} />
}
