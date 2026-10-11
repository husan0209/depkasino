import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { TransactionsClient } from '@/components/wallet/TransactionsClient'

export const metadata: Metadata = {
  title: 'История транзакций',
  robots: { index: false, follow: false }
}

export default function TransactionsPage() {
  return (
    <Protected>
      <TransactionsClient />
    </Protected>
  )
}
