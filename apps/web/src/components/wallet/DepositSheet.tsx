'use client'

import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, ShieldCheck } from 'lucide-react'
import { AmountInput, AmountPresets, Button, CurrencyAmount, NetworkTag, Sheet } from '@/components/ui'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import { useGeoStore } from '@/stores/geo'
import { useCreateDeposit, useDepositStatus } from '@/hooks/usePayments'
import { useKycStatus } from '@/hooks/useWalletData'
import { CRYPTO_METHODS, methodsForCurrency } from '@/mocks/geo'
import { amountToNumber, formatAmount } from '@/lib/format'
import { CURRENCY_ASSETS, CURRENCY_NAMES } from '@/constants/currencies'
import { cn } from '@/lib/cn'
import { toast } from '@/stores/toast'
import { formatDeadline } from '@/lib/dates'
import type { Currency, PaymentMethod } from '@/types'

/**
 * DepositSheet (§4.9 Части 5.1): один экран вместо шагов 1/2 —
 * методы и сумма на одном скролле, последний успешный метод уже выбран.
 *
 * Правила, которые касса не нарушает никогда (§10.4):
 * не суммирует кошельки, не конвертирует крипту, не показывает чужие гео-методы,
 * не выкидывает из игры на /wallet.
 */
export function DepositSheet() {
  const open = useUIStore((state) => state.depositSheet)
  const close = useUIStore((state) => state.closeDeposit)
  const depositCurrency = useUIStore((state) => state.depositCurrency)

  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const wallets = useWalletStore((state) => state.wallets)
  const setActiveCurrency = useWalletStore((state) => state.setActiveCurrency)
  const lastPaymentMethod = useWalletStore((state) => state.lastPaymentMethod)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openLogin = useUIStore((state) => state.openLogin)
  const geo = useGeoStore((state) => state.geo)

  const currency: Currency = depositCurrency ?? activeCurrency
  const asset = CURRENCY_ASSETS[currency]
  const isCrypto = asset.kind === 'crypto'

  const { data: kyc } = useKycStatus()
  const createDeposit = useCreateDeposit()

  const [methodId, setMethodId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState(false)

  const { primary, extra } = useMemo(() => {
    if (!geo) return { primary: [] as PaymentMethod[], extra: [] as PaymentMethod[] }
    return methodsForCurrency(geo, currency)
  }, [geo, currency])

  // Последний успешный метод первый; иначе — первый доступный в этом гео.
  const sortedMethods = useMemo(() => {
    if (primary.length === 0) return primary
    const last = primary.find((m) => m.id === lastPaymentMethod)
    if (!last) return primary
    return [last, ...primary.filter((m) => m.id !== last.id)]
  }, [primary, lastPaymentMethod])

  useEffect(() => {
    if (!open) return
    setMethodId(sortedMethods[0]?.id ?? (isCrypto ? CRYPTO_METHODS.find((m) => m.currency === currency)?.id ?? null : null))
    setAmount('')
    setPaymentId(null)
    setSuccess(false)
    setCopied(false)
  }, [open, currency, isCrypto, sortedMethods])

  const { data: intent, refetch: refetchIntent, isFetching: isChecking } = useDepositStatus(paymentId, {
    onCompleted: (completed) => {
      setSuccess(true)
      // Успех переключает активный кошелёк на валюту депозита (в том числе USDT).
      setActiveCurrency(completed.currency)
      toast.money(`${formatAmount(completed.amount, completed.currency, { context: 'wallet' })} зачислены`, 'Баланс обновлён')
    }
  })

  const numericAmount = amountToNumber(amount)
  const minAmount = isCrypto ? asset.minDeposit : (sortedMethods.find((m) => m.id === methodId)?.min ?? asset.minDeposit)
  const amountError = numericAmount > 0 && numericAmount < minAmount ? `Минимум ${formatAmount(minAmount, currency, { context: 'wallet' })}` : undefined
  const kycRemaining = kyc && kyc.status !== 'approved' ? (currency === 'RUB' ? kyc.limits.remaining : undefined) : undefined

  const handleClose = () => {
    close()
    setPaymentId(null)
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      close()
      openLogin()
      return
    }
    if (!methodId || numericAmount <= 0 || amountError) return
    try {
      const intentResult = await createDeposit.mutateAsync({ currency, amount: numericAmount, methodId })
      if (isCrypto) {
        setPaymentId(intentResult.id)
      } else {
        setPaymentId(intentResult.id)
        toast.info('Переходим к оплате', 'Откроем страницу платёжного сервиса в новой вкладке')
      }
    } catch (error) {
      toast.error('Не удалось создать платёж', (error as Error).message)
    }
  }

  const copyAddress = async () => {
    if (!intent?.address) return
    try {
      await navigator.clipboard.writeText(intent.address)
      setCopied(true)
      toast.success('Адрес скопирован')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать', 'Выделите адрес вручную')
    }
  }

  const title = success ? 'Готово' : `Пополнить ${CURRENCY_NAMES[currency]}`

  if (success) {
    const completedAmount = intent?.amount ?? numericAmount
    return (
      <Sheet open={open} onClose={handleClose} title={title} subtitle="Средства на кошельке">
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-money/15 text-money">
            <Check className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-semibold text-white">
            <CurrencyAmount amount={completedAmount} currency={currency} context="wallet" signed />
          </p>
          <p className="mt-1 text-sm text-ink-muted">зачислены в кошелёк {currency}</p>
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="money" fullWidth size="lg" onClick={handleClose}>
            Вернуться в игру
          </Button>
          <Button variant="ghost" fullWidth onClick={handleClose}>
            Закрыть
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={isCrypto ? undefined : 'Набор методов зависит от вашей страны и валюты'}
      footer={
        <div className="space-y-2">
          <Button
            variant="money"
            fullWidth
            size="lg"
            loading={createDeposit.isPending}
            disabled={!methodId || numericAmount <= 0 || !!amountError}
            onClick={handleSubmit}
          >
            Перейти к оплате →
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-2xs text-ink-dim">
            <ShieldCheck className="h-3.5 w-3.5 text-money" />
            Платёж защищён · зачисление обычно за 1 минуту
          </p>
        </div>
      }
    >
      {isCrypto ? (
        <CryptoDeposit
          currency={currency}
          address={intent?.address}
          deadline={intent?.deadline}
          paid={false}
          copied={copied}
          onCopy={copyAddress}
          onCheck={() => void 0}
        />
      ) : (
        <div className="space-y-5">
          <section>
            <p className="section-label mb-2">Способ оплаты</p>
            <div className="space-y-1.5">
              {sortedMethods.map((method) => (
                <MethodRow
                  key={method.id}
                  method={method}
                  selected={methodId === method.id}
                  isLast={method.id === lastPaymentMethod}
                  onSelect={() => setMethodId(method.id)}
                />
              ))}
            </div>

            {/* Крипта при активном фиате — только в «Ещё способы», не в первом ряду (§2.7) */}
            {extra.length > 0 && (
              <div className="mt-3 rounded-2xl border border-line/70 bg-bg-secondary/40 p-3">
                <p className="section-label mb-2">Ещё способы</p>
                <div className="flex flex-wrap gap-2">
                  {extra.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setActiveCurrency(method.currency as Currency)
                        handleClose()
                        setTimeout(() => useUIStore.getState().openDeposit(method.currency as Currency), 120)
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-bg-secondary px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-accent-secondary/50 hover:text-white"
                    >
                      {method.name}
                      <NetworkTag network={method.network} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <p className="section-label mb-2">Сумма</p>
            <AmountInput value={amount} onChange={setAmount} currency={currency} error={amountError} autoFocus />
            <div className="mt-3">
              <AmountPresets currency={currency} value={numericAmount} onSelect={(value) => setAmount(String(value))} />
            </div>
            <div className="mt-3 space-y-1 text-xs text-ink-muted">
              <p>Минимум {formatAmount(minAmount, currency, { context: 'wallet' })}</p>
              {typeof kycRemaining === 'number' && (
                <p>Без верификации осталось {formatAmount(kycRemaining, currency, { context: 'wallet' })}</p>
              )}
            </div>
          </section>
        </div>
      )}

      {isCrypto && !paymentId && (
        <div className="mt-4">
          <Button fullWidth variant="secondary" onClick={handleSubmit} loading={createDeposit.isPending} disabled={!methodId}>
            Показать адрес
          </Button>
        </div>
      )}

      {isCrypto && paymentId && (
        <div className="mt-4 space-y-2">
          {intent?.deadline && (
            <p className="text-center text-xs text-ink-muted">
              Ожидаем оплату · до {formatDeadline(new Date(intent.deadline))}
            </p>
          )}
          <Button
            variant="secondary"
            fullWidth
            loading={isChecking}
            onClick={() => {
              // Опрашиваем сам платёж и подтягиваем баланс этого кошелька — без выхода из игры.
              void refetchIntent()
              void useWalletStore.getState().refreshActive()
            }}
          >
            Проверить статус
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function MethodRow({
  method,
  selected,
  isLast,
  onSelect
}: {
  method: PaymentMethod
  selected: boolean
  isLast: boolean
  onSelect(): void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
        selected ? 'border-accent bg-accent/10' : 'border-line bg-bg-secondary/60 hover:border-accent/40'
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-11 items-center justify-center rounded-lg border border-line bg-bg-card text-2xs font-bold uppercase tracking-wide text-ink-muted">
          {method.icon}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-white">{method.name}</span>
          <span className="text-2xs text-ink-muted">{method.etaLabel}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        {isLast && <span className="text-2xs text-ink-dim">в прошлый раз</span>}
        {selected && <Check className="h-4 w-4 text-accent" />}
      </span>
    </button>
  )
}

/** Крипто-касса: сеть крупно и всегда, адрес, QR, факт зачисления (§10.2). */
function CryptoDeposit({
  currency,
  address,
  deadline,
  copied,
  onCopy,
  onCheck
}: {
  currency: Currency
  address?: string
  deadline?: string
  paid: boolean
  copied: boolean
  onCopy(): void
  onCheck(): void
}) {
  const network = currency === 'USDT' ? 'TRC20' : 'Bitcoin'
  const warning = currency === 'USDT' ? 'Только USDT в сети TRC20. ERC20 на этот адрес = потеря денег.' : 'Только BTC в сети Bitcoin.'

  if (!address) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-bg-secondary/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Сеть</span>
            <NetworkTag network={currency === 'USDT' ? 'TRC20' : 'BTC'} />
          </div>
          <p className="mt-3 text-sm text-white">Отправьте только {currency} в сети {network}</p>
          <p className="mt-1 text-xs text-warning">{warning}</p>
        </div>
        <p className="text-sm text-ink-muted">
          Нажмите «Показать адрес» — сгенерируем адрес и QR. Сумму не нужно подгонять: зачислим фактический платёж.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-bg-secondary/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Сеть</span>
          <NetworkTag network={currency === 'USDT' ? 'TRC20' : 'BTC'} />
        </div>
        <p className="mt-3 text-sm font-semibold text-white">
          Отправьте только {currency} в сети {network}
        </p>
        <p className="mt-1 text-xs text-warning">{warning}</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-bg-secondary/40 p-4">
        <div className="rounded-2xl bg-white p-3">
          <QRCodeSVG value={address} size={148} level="M" />
        </div>
        <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-bg-card px-3 py-2.5">
          <span className="money-tabular min-w-0 flex-1 truncate text-xs text-ink">{address}</span>
          <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
        {deadline && <p className="text-xs text-ink-muted">Ожидаем оплату · до {formatDeadline(new Date(deadline))}</p>}
        <p className="text-2xs text-ink-dim">Зачисляем фактический входящий платёж. Сумму подгонять не нужно.</p>
      </div>
    </div>
  )
}
