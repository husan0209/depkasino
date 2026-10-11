'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Monitor, Smartphone } from 'lucide-react'
import { Avatar, Badge, Button, ConfirmModal, Input, Select, Skeleton, Tabs } from '@/components/ui'
import { usersApi, queryKeys } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { COUNTRY_NAMES, KYC_STATUS_LABELS, TIMEZONES } from '@/constants/currencies'
import { formatDate, formatShortDate } from '@/lib/dates'
import { cn } from '@/lib/cn'

type Tab = 'data' | 'security' | 'sessions' | 'settings'

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'data', label: 'Данные' },
  { value: 'security', label: 'Безопасность' },
  { value: 'sessions', label: 'Сессии' },
  { value: 'settings', label: 'Настройки' }
]

const kycVariants = {
  approved: 'success',
  on_review: 'warning',
  pending: 'warning',
  resubmit: 'warning',
  rejected: 'danger',
  not_started: 'neutral'
} as const

/**
 * Профиль (§9 и §5.7 Части 5.1).
 * KYC-статус — спокойная строка; кнопка «Пройти верификацию» только если статус мешает выводу.
 */
export function ProfileClient({ tab: initialTab = 'data' }: { tab?: Tab }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<Tab>(initialTab)

  if (!user) {
    return (
      <div className="container-page mt-6 space-y-4">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="container-page mt-6">
      <section className="card-surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.firstName ?? user.email} src={user.avatarUrl} size="xl" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">{user.firstName ?? 'Игрок'}</h1>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <Badge variant={kycVariants[user.kycStatus]}>{KYC_STATUS_LABELS[user.kycStatus]}</Badge>
              <span>с нами с {formatDate(user.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          {user.withdrawalBlockedByKyc ? (
            <Button size="sm" onClick={() => router.push('/kyc')}>
              Пройти верификацию
            </Button>
          ) : null}
          <p className="text-2xs text-ink-dim">
            Реферальный код: <span className="money-tabular text-ink-muted">{user.referralCode}</span>
          </p>
        </div>
      </section>

      <Tabs items={TABS} value={tab} onChange={(value) => setTab(value)} className="mt-5" />

      <div className="mt-5">
        {tab === 'data' && <DataTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'sessions' && <SessionsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function DataTab() {
  const user = useAuthStore((state) => state.user)!
  const updateUser = useAuthStore((state) => state.updateUser)
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    birthDate: user.birthDate ?? '',
    country: user.country ?? 'KZ',
    city: user.city ?? ''
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await usersApi.updateMe({ ...form, birthDate: form.birthDate || undefined })
      updateUser(form)
      toast.success('Данные сохранены')
    } catch (error) {
      toast.error('Не удалось сохранить', (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input label="Имя" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
      <Input label="Фамилия" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
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
      <Input label="Город" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
      <div className="flex items-end">
        <Button onClick={save} loading={saving} fullWidth>
          Сохранить
        </Button>
      </div>
      <p className="text-xs text-ink-dim md:col-span-2">
        Страна влияет на набор платёжных методов. Валюта кошелька меняется отдельно — в шапке, тапом по балансу.
      </p>
    </div>
  )
}

/** OAuth-аккаунт без формы смены пароля, с пояснением (§9). */
function SecurityTab() {
  const user = useAuthStore((state) => state.user)!
  const isOauth = user.email.includes('@google') || user.email.includes('@telegram')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(false)

  if (isOauth) {
    return (
      <div className="card-surface p-5 text-sm text-ink-muted">
        Вы вошли через {user.email.includes('@google') ? 'Google' : 'Telegram'}. Пароль меняется в настройках этого аккаунта —
        здесь форма не нужна.
      </div>
    )
  }

  return (
    <form
      className="grid max-w-md grid-cols-1 gap-3"
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        try {
          await usersApi.changePassword(current, next)
          toast.success('Пароль обновлён')
          setCurrent('')
          setNext('')
        } catch (error) {
          toast.error('Пароль не изменён', (error as Error).message)
        } finally {
          setLoading(false)
        }
      }}
    >
      <Input label="Текущий пароль" type="password" revealToggle value={current} onChange={(event) => setCurrent(event.target.value)} />
      <Input label="Новый пароль" type="password" revealToggle value={next} onChange={(event) => setNext(event.target.value)} />
      <Button type="submit" loading={loading} disabled={!current || next.length < 8}>
        Сменить пароль
      </Button>
    </form>
  )
}

function SessionsTab() {
  const queryClient = useQueryClient()
  const [confirmAll, setConfirmAll] = useState(false)
  const { data: sessions, isLoading } = useQuery({ queryKey: queryKeys.sessions, queryFn: () => usersApi.sessions() })

  const terminate = useMutation({
    mutationFn: (id: string) => usersApi.terminateSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      toast.success('Сессия завершена')
    }
  })

  const terminateOthers = useMutation({
    mutationFn: () => usersApi.terminateOthers(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      toast.success('Остальные сессии завершены')
    }
  })

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />

  return (
    <div className="space-y-2">
      {sessions?.map((session) => (
        <div key={session.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-card p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-secondary text-ink-muted">
              {session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android') ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">
                {session.device}
                {session.current && <span className="ml-2 text-2xs text-money">это устройство</span>}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {session.ip} · {formatShortDate(session.lastSeenAt)}
              </p>
            </div>
          </div>
          {!session.current && (
            <Button size="sm" variant="ghost" onClick={() => terminate.mutate(session.id)}>
              Завершить
            </Button>
          )}
        </div>
      ))}

      {sessions && sessions.length > 1 && (
        <Button variant="danger" size="sm" onClick={() => setConfirmAll(true)}>
          Завершить все, кроме текущей
        </Button>
      )}

      <ConfirmModal
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={() => {
          terminateOthers.mutate()
          setConfirmAll(false)
        }}
        title="Завершить остальные сессии?"
        description="На других устройствах потребуется войти заново."
        confirmLabel="Завершить"
        variant="danger"
      />
    </div>
  )
}

function SettingsTab() {
  const user = useAuthStore((state) => state.user)!
  const updateUser = useAuthStore((state) => state.updateUser)
  const [settings, setSettings] = useState(user.settings)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await usersApi.updateMe({ settings })
      updateUser({ settings })
      toast.success('Настройки сохранены')
    } catch (error) {
      toast.error('Не удалось сохранить', (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-card p-3.5">
        <span>
          <span className="block text-sm text-white">Email-уведомления</span>
          <span className="block text-xs text-ink-muted">Статусы платежей и ответы поддержки</span>
        </span>
        <input
          type="checkbox"
          className={cn('h-5 w-5 accent-accent')}
          checked={settings.emailNotifications}
          onChange={(event) => setSettings({ ...settings, emailNotifications: event.target.checked })}
        />
      </label>

      <Select
        label="Часовой пояс"
        value={settings.timezone}
        onChange={(value) => setSettings({ ...settings, timezone: value })}
        options={TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
      />

      {/* Язык в релизе только русский — селект не показываем (§9) */}
      <p className="text-xs text-ink-dim">Язык интерфейса в этой версии — русский.</p>

      <Button onClick={save} loading={saving}>
        Сохранить настройки
      </Button>
    </div>
  )
}
