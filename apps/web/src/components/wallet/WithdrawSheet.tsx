'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { AmountInput, Button, ConfirmModal, CurrencyAmount, Input, NetworkTag, Select, Sheet } from '@/components/ui'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'
import { useGeoStore } from '@/stores/geo'
import { useCreateWithdrawal } from '@/hooks/usePayments'
import { useKycStatus } from '@/hooks/useWalletData'
import { CRYPTO_METHODS, methodsForCurrency } from '@/mocks/geo'
import { CURRENCY_ASSETS, CURRENCY_NAMES } from '@/constants/currencies'
import { amountToNumber, formatAmount } from '@/lib/format'
import type { Currency } from '@/types'

/** Валидация адреса до сабмита: TRC20-адрес не должен проходить валидацию BTC (§10.3). */
export function validateCryptoAddress(currency: Currency, address: string): string | undefined {
  const value = address.trim()
  if (!value) return 'Укажите адрес'
  if (currency === 'USDT') {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value) ? undefined : 'Похоже, это не адрес TRC20'
  }
  if (currency === 'BTC') {
    return /^(bc1[a-z0-9]{25,62}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(value) ? undefined : 'Похоже, это не адрес Bitcoin'
  }
  return undefined
}

/**
 * WithdrawSheet (§10.3).
 * Порядок проверок до формы: KYC → «нечего выводить» → предложить ненулевую валюту.
 * Вывод только в валюте кошелька и только на метод этой валюты.
 */
export function WithdrawSheet() {
  const open = useUIStore((state) => state.withdrawSheet)
  const close = useUIStore((state) => state.closeWithdraw)
  const withdrawCurrency = useUIStore((state) => state.withdrawCurrency)
  const openWithdraw = useUIStore((state) => state.openWithdraw)

  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const wallets = useWalletStore((state) => state.wallets)
  const getWallet = useWalletStore((state) => state.getWallet)
  const nonZero = wallets.filter((w) => w.balance > 0)
  const geo = useGeoStore((state) => state.geo)
  const { data: kyc, isLoading: kycLoading } = useKycStatus()
  const createWithdrawal = useCreateWithdrawal()

  const currency: Currency = withdrawCurrency ?? activeCurrency
  const asset = CURRENCY_ASSETS[currency]
  const isCrypto = asset.kind === 'crypto'
  const wallet = getWallet(currency)

  const [amount, setAmount] = useState('')
  const [methodId, setMethodId] = useState('')
  const [destination, setDestination] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [created, setCreated] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useMemo(() => {
    if (!geo) return []
    return isCrypto ? CRYPTO_METHODS.filter((m) => m.currency === currency) : methodsForCurrency(geo, currency).primary
  }, [geo, currency, isCrypto])

  useEffect(() => {
    if (!open) return
    setAmount('')
    setDestination('')
    setCreated(null)
    setMethodId(methods[0]?.id ?? '')
  }, [open, currency, methods])

  const numericAmount = amountToNumber(amount)
  const minAmount = asset.minWithdraw
  const amountError =
    numericAmount > 0 && numericAmount < minAmount
      ? `Минимум ${formatAmount(minAmount, currency, { context: 'wallet' })}`
      : numericAmount > (wallet?.balance ?? 0)
        ? 'Больше, чем на кошельке'
        : undefined
  const destinationError = isCrypto ? validateCryptoAddress(currency, destination) : !destination ? 'Укажите реквизиты' : undefined
  const canSubmit = numericAmount > 0 && !amountError && !destinationError && !!methodId

  const handleClose = () => {
    close()
    setCreated(null)
  }

  /* 1. KYC-стопер: одна кнопка, без формы карты/адреса. */
  if (!kycLoading && kyc && kyc.status !== 'approved') {
    return (
      <Sheet open={open} onClose={handleClose} title="Вывод" subtitle="Сначала верификация">
        <div className="flex flex-col items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <p className="text-sm text-ink-muted">
            Вывод открывается после проверки личности. Это разовая процедура — обычно 5–10 минут.
          </p>
          <Button variant="primary" fullWidth onClick={handleClose} className="mt-1">
            <Link href="/kyc" className="flex w-full items-center justify-center">
              Пройти верификацию
            </Link>
          </Button>
        </div>
      </Sheet>
    )
  }

  /* 2. Нечего выводить. */
  if (nonZero.length === 0) {
    return (
      <Sheet open={open} onClose={handleClose} title="Вывод" subtitle="Все кошельки пусты">
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">На кошельках пока нет денег. Пополните — и вывод откроется.</p>
          <Button
            variant="money"
            fullWidth
            onClick={() => {
              handleClose()
              useUIStore.getState().openDeposit()
            }}
          >
            Пополнить
          </Button>
        </div>
      </Sheet>
    )
  }

  /* 3. Активный пуст, но деньги есть в другом кошельке — предлагаем его, не открываем нулевую форму. */
  if ((wallet?.balance ?? 0) === 0) {
    const alternative = nonZero[0]
    return (
      <Sheet open={open} onClose={handleClose} title="Вывод" subtitle={`В ${CURRENCY_NAMES[currency]} пусто`}>
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Есть деньги на другом кошельке. Выведем именно оттуда.</p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              useWalletStore.getState().setActiveCurrency(alternative.currency)
              openWithdraw(alternative.currency)
            }}
          >
            Вывести {formatAmount(alternative.balance, alternative.currency, { context: 'wallet' })}
          </Button>
        </div>
      </Sheet>
    )
  }

  if (created) {
    return (
      <Sheet open={open} onClose={handleClose} title="Заявка создана" subtitle={`Номер ${created}`}>
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-bg-secondary/50 p-4 text-sm text-ink-muted">
            <p className="text-white">
              <CurrencyAmount amount={numericAmount} currency={currency} context="wallet" />
            </p>
            <p className="mt-1">Статус: в обработке · срок до 24 часов</p>
          </div>
          <Button variant="secondary" fullWidth onClick={handleClose}>
            <Link href="/wallet/transactions" className="flex w-full items-center justify-center">
              История транзакций
            </Link>
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={handleClose}
        title={`Вывести ${CURRENCY_NAMES[currency]}`}
        subtitle={isCrypto ? undefined : 'Только на метод этой валюты'}
        footer={
          <div className="space-y-2">
            {submitError && (
              <p className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {submitError}
              </p>
            )}
            <Button variant="primary" fullWidth size="lg" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
              Создать заявку
            </Button>
            <p className="text-center text-2xs text-ink-dim">Обработка до 24 часов · комиссию покажем перед подтверждением</p>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-bg-secondary/50 p-4">
            <p className="text-xs text-ink-muted">Доступно</p>
            <p className="mt-1 text-lg font-semibold text-white">
              <CurrencyAmount amount={wallet?.balance ?? 0} currency={currency} context="wallet" />
            </p>
            {isCrypto && <NetworkTag network={currency === 'USDT' ? 'TRC20' : 'BTC'} className="mt-2" />}
          </div>

          <section>
            <p className="section-label mb-2">Сумма</p>
            <AmountInput
              value={amount}
              onChange={(next) => {
                setSubmitError(null)
                setAmount(next)
              }}
              currency={currency}
              error={amountError}
            />
            <div className="mt-3 flex gap-2">
              {[25, 50, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => {
                    const value = Number((((wallet?.balance ?? 0) * percent) / 100).toFixed(asset.walletDecimals))
                    setAmount(value.toLocaleString('ru-RU').replace(/\u00A0/g, ' '))
                  }}
                  className="h-9 flex-1 rounded-xl border border-line bg-bg-secondary text-xs font-semibold text-ink-muted hover:border-accent/50 hover:text-ink"
                >
                  {percent === 100 ? 'Всё' : `${percent}%`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">Минимум {formatAmount(minAmount, currency, { context: 'wallet' })}</p>
          </section>

          <section className="space-y-3">
            <p className="section-label">Реквизиты</p>
            {!isCrypto && methods.length > 1 && (
              <Select
                value={methodId}
                onChange={(next) => {
                  setSubmitError(null)
                  setMethodId(next)
                }}
                options={methods.map((m) => ({ value: m.id, label: m.name }))}
                label="Метод"
              />
            )}
            {isCrypto && (
              <div>
                <Input
                  label={`Адрес ${currency === 'USDT' ? 'TRC20' : 'Bitcoin'}`}
                  placeholder={currency === 'USDT' ? 'TXk9…Uf' : 'bc1q…'}
                  value={destination}
                  onChange={(event) => {
                    setSubmitError(null)
                    setDestination(event.target.value)
                  }}
                  error={destination ? destinationError : undefined}
                  hint="Сеть менять нельзя — адрес принимаем только этой сети"
                />
              </div>
            )}
            {!isCrypto && (
              <Input
                label="Карта или телефон"
                placeholder="0000 0000 0000 0000"
                value={destination}
                onChange={(event) => {
                  setSubmitError(null)
                  setDestination(event.target.value)
                }}
                error={destination ? destinationError : undefined}
              />
            )}
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Вывод идёт строго в валюте кошелька — конвертации нет.
          </div>
        </div>
      </Sheet>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            const result = await createWithdrawal.mutateAsync({
              currency,
              amount: numericAmount,
              methodId,
              destination
            })
            setCreated(result.id)
            setConfirmOpen(false)
          } catch (error) {
            setConfirmOpen(false)
            useUIStore.getState().openWithdraw(currency)
            // Ошибки кассы не схлопываются в один общий toast (§23 блок I) — показываем текстом в шите.
            setSubmitError((error as Error).message)
          }
        }}
        loading={createWithdrawal.isPending}
        variant="money"
        title="Подтвердить вывод"
        confirmLabel="Вывести"
        description={
          <div className="space-y-1">
            <p>
              <CurrencyAmount amount={numericAmount} currency={currency} context="wallet" /> на {methods.find((m) => m.id === methodId)?.name ?? 'выбранный метод'}
            </p>
            {destination && <p className="text-xs text-ink-dim">{destination}</p>}
          </div>
        }
      />
    </>
  )
}
