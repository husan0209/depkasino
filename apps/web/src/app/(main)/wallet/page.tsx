import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { WalletClient } from '@/components/wallet/WalletClient'

export const metadata: Metadata = {
  title: 'Кошелёк',
  robots: { index: false, follow: false }
}

export default function WalletPage() {
  return (
    <Protected>
      <WalletClient />
    </Protected>
  )
}
