'use client'

import { LoginSheet } from '@/components/auth/LoginSheet'
import { DepositSheet } from '@/components/wallet/DepositSheet'
import { WithdrawSheet } from '@/components/wallet/WithdrawSheet'
import { WalletSwitcherSheet } from '@/components/wallet/WalletSwitcherSheet'
import { GamePreviewSheet } from '@/components/game/GamePreviewSheet'
import { LaunchCurrencySheet, EmptyWalletSheet } from '@/components/game/LaunchSheets'

/**
 * Все глобальные шиты живут в корне (main) layout (§3.1).
 * Так они открываются поверх игры и переживают смену роута.
 */
export function RootSheets() {
  return (
    <>
      <WalletSwitcherSheet />
      <DepositSheet />
      <WithdrawSheet />
      <LoginSheet />
      <GamePreviewSheet />
      <LaunchCurrencySheet />
      <EmptyWalletSheet />
    </>
  )
}
