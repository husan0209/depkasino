'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, CheckCircle2, Clock, FileText, ShieldCheck, XCircle } from 'lucide-react'
import { Button, CurrencyAmount, Input, QueryError, Select, Skeleton } from '@/components/ui'
import { kycApi, queryKeys } from '@/lib/api'
import { useKycStatus } from '@/hooks/useWalletData'
import { useWalletStore } from '@/stores/wallet'
import { formatAmount } from '@/lib/format'
import { COUNTRY_NAMES } from '@/constants/currencies'
import { formatShortDate } from '@/lib/dates'
import { toast } from '@/stores/toast'
import type { Currency } from '@/types'

/**
 * KYC (§13, §5.4 Части 5.1). Шесть состояний как продуктовые экраны.
 * Лимит показываем в АКТИВНОЙ валюте — иначе человек с ₸ видит «до 5 000 ₽» и не понимает, что это значит.
 */
export function KycClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useKycStatus()
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    country: 'KZ',
    documentType: 'passport' as 'passport' | 'id_card'
  })
  const [documentFile, setDocumentFile] = useState('')
  const [selfieFile, setSelfieFile] = useState('')

  const submit = useMutation({
    mutationFn: () => kycApi.submit({ ...form, documentFileName: documentFile, selfieFileName: selfieFile }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.kyc })
      toast.success('Документы отправлены', 'Обычно проверка занимает 5–10 минут')
    }
  })

  if (isError) {
    return (
      <div className="container-page mt-6">
        <QueryError title="Статус верификации не загрузился" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (isLoading || !data) return <div className="container-page mt-6"><Skeleton className="h-64 w-full rounded-3xl" /></div>

  const currency: Currency = activeCurrency
  const limitLabel = formatAmount(data.limits.withoutVerification, currency, { context: 'wallet' })
  const remainingLabel = formatAmount(data.limits.remaining, currency, { context: 'wallet' })
  const isFiatActive = currency !== 'USDT' && currency !== 'BTC'

  return (
    <div className="container-page mt-6 max-w-2xl">
      <p className="section-label">Верификация</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Проверка личности</h1>

      {data.status === 'not_started' && (
        <div className="card-surface mt-5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Без верификации: до {isFiatActive ? limitLabel : `${limitLabel} в валюте кошелька`}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Осталось {remainingLabel} · вывод денег открывается после проверки
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
              <div className="h-full rounded-full bg-accent" style={{ width: '36%' }} />
            </div>
            <p className="mt-2 text-2xs text-ink-dim">Прогресс: осталось заполнить анкету и загрузить документы</p>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs text-ink-muted">
            <li>• Разовая процедура, обычно 5–10 минут</li>
            <li>• Документы видит только отдел проверки</li>
            <li>• Открывает вывод и снимает лимит на пополнение</li>
          </ul>

          <div className="mt-5">
            <KycForm
              form={form}
              setForm={setForm}
              documentFile={documentFile}
              selfieFile={selfieFile}
              setDocumentFile={setDocumentFile}
              setSelfieFile={setSelfieFile}
              onSubmit={() => submit.mutate()}
              loading={submit.isPending}
            />
          </div>
        </div>
      )}

      {data.status === 'on_review' && <KycStateCard icon={<Clock className="h-6 w-6" />} tone="accent" title="Документы на проверке" text={`Отправили ${data.submittedAt ? formatShortDate(data.submittedAt) : 'только что'}. Обычно проверка занимает 5–10 минут.`} onAction={() => router.push('/wallet')} actionLabel="Пока в кошелёк" />}

      {data.status === 'resubmit' && (
        <KycStateCard
          icon={<FileText className="h-6 w-6" />}
          tone="warning"
          title="Нужна повторная отправка"
          text={data.reason ?? 'Документ нечитаем. Загрузите фото при хорошем свете — и всё получится.'}
          onAction={() => queryClient.setQueryData(queryKeys.kyc, { ...data, status: 'not_started' })}
          actionLabel="Загрузить заново"
        />
      )}

      {data.status === 'rejected' && (
        <KycStateCard
          icon={<XCircle className="h-6 w-6" />}
          tone="danger"
          title="Верификация отклонена"
          text={data.reason ?? 'Причина указана в письме. Можно подать заново — лимитов на попытки нет.'}
          onAction={() => queryClient.setQueryData(queryKeys.kyc, { ...data, status: 'not_started' })}
          actionLabel="Подать заново"
        />
      )}

      {data.status === 'approved' && (
        <KycStateCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="money"
          title="Личность подтверждена"
          text={`Лимит на пополнение: ${formatAmount(data.limits.withVerification, currency, { context: 'wallet' })}. Вывод доступен.`}
          onAction={() => router.push('/wallet')}
          actionLabel="В кошелёк"
        />
      )}

      {data.status !== 'not_started' && data.status !== 'approved' && (
        <p className="mt-4 text-center text-xs text-ink-dim">
          Статус: {data.status === 'on_review' ? 'на проверке' : 'нужна повторная отправка'}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-bg-secondary/40 p-4 text-xs text-ink-muted">
        <p className="text-white">Лимит считается по кошельку, который пополняют</p>
        <p className="mt-1">
          Активный кошелёк — {currency}: без верификации до {limitLabel}, осталось {remainingLabel}. Смените кошелёк в шапке —
          лимит пересчитается в его валюте.
        </p>
      </div>
    </div>
  )
}

function KycStateCard({
  icon,
  tone,
  title,
  text,
  onAction,
  actionLabel
}: {
  icon: React.ReactNode
  tone: 'accent' | 'warning' | 'danger' | 'money'
  title: string
  text: string
  onAction(): void
  actionLabel: string
}) {
  const tones = {
    accent: 'bg-accent/15 text-accent',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
    money: 'bg-money/15 text-money'
  } as const

  return (
    <div className="card-surface mt-5 p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-ink-muted">{text}</p>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  )
}

function KycForm({
  form,
  setForm,
  documentFile,
  selfieFile,
  setDocumentFile,
  setSelfieFile,
  onSubmit,
  loading
}: {
  form: { firstName: string; lastName: string; birthDate: string; country: string; documentType: 'passport' | 'id_card' }
  setForm(value: typeof form): void
  documentFile: string
  selfieFile: string
  setDocumentFile(value: string): void
  setSelfieFile(value: string): void
  onSubmit(): void
  loading: boolean
}) {
  const canSubmit = form.firstName && form.lastName && form.birthDate && documentFile && selfieFile

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Имя" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <Input label="Фамилия" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Дата рождения"
          type="date"
          value={form.birthDate}
          onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
        />
        <Select
          label="Страна"
          value={form.country}
          onChange={(value) => setForm({ ...form, country: value })}
          options={Object.entries(COUNTRY_NAMES).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <Select
        label="Документ"
        value={form.documentType}
        onChange={(value) => setForm({ ...form, documentType: value })}
        options={[
          { value: 'passport', label: 'Паспорт' },
          { value: 'id_card', label: 'ID-карта' }
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilePicker
          label="Документ"
          icon={<FileText className="h-4 w-4" />}
          fileName={documentFile}
          onChange={setDocumentFile}
          hint="Фото страницы с данными"
        />
        <FilePicker
          label="Селфи"
          icon={<Camera className="h-4 w-4" />}
          fileName={selfieFile}
          onChange={setSelfieFile}
          hint="С документом в руках"
        />
      </div>

      <Button fullWidth size="lg" onClick={onSubmit} loading={loading} disabled={!canSubmit}>
        Отправить на проверку
      </Button>
    </div>
  )
}

function FilePicker({
  label,
  icon,
  fileName,
  onChange,
  hint
}: {
  label: string
  icon: React.ReactNode
  fileName: string
  onChange(value: string): void
  hint: string
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-1.5">
      <span className="flex items-center gap-2 rounded-2xl border border-dashed border-line bg-bg-secondary/50 p-4 text-sm text-ink-muted transition-colors hover:border-accent/60">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-card text-accent">{icon}</span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-white">{fileName || label}</span>
          <span className="block text-2xs text-ink-dim">{fileName ? 'Файл выбран' : hint}</span>
        </span>
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')}
      />
    </label>
  )
}
