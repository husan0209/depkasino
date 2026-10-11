import type { Metadata } from 'next'
import { LaunchErrorScreen } from '@/components/game/LaunchErrorScreen'

export const metadata: Metadata = { title: 'Ошибка запуска', robots: { index: false, follow: false } }

/**
 * Ошибки запуска — отдельные экраны, не общий toast (§8.4):
 * игра недоступна в регионе, провайдер не ответил, сессия уже открыта,
 * недостаточно средств, валюта не поддерживается, техработы.
 */
export default function PlayErrorPage({
  searchParams
}: {
  searchParams: { code?: string; game?: string }
}) {
  return <LaunchErrorScreen code={searchParams.code ?? 'provider_timeout'} gameSlug={searchParams.game} />
}
