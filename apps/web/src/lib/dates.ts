import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Относительное время для last played: «Только что», «6 ч назад», «вчера». */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60_000) return 'Только что'
  if (isToday(date)) {
    const hours = Math.floor(diffMs / 3_600_000)
    if (hours < 1) return `${Math.max(1, Math.floor(diffMs / 60_000))} мин назад`
    return `${hours} ч назад`
  }
  if (isYesterday(date)) return 'Вчера'

  const days = Math.floor(diffMs / 86_400_000)
  if (days < 30) return `${days} дн назад`
  return format(date, 'd MMM', { locale: ru })
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: ru })
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), 'dd.MM.yyyy HH:mm', { locale: ru })
}

export function formatDuration(fromIso: string, toIso: string): string {
  return formatDistanceToNowStrict(new Date(fromIso), { locale: ru, addSuffix: false })
}

/** Дедлайн крипто-депозита: «до 14:35». */
export function formatDeadline(date: Date): string {
  return format(date, 'HH:mm')
}
