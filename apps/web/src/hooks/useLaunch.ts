'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { casinoApi, ApiError, queryKeys } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { useUIStore } from '@/stores/ui'
import { useLaunchStore } from '@/stores/launch'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import { formatAmount } from '@/lib/format'
import {
  balanceOf,
  firstSupported,
  nonZeroCurrencies,
  resolveLaunchDecision,
  switchQuestionKind,
  type LaunchContext,
  type LaunchDecision
} from '@/lib/launch-decision'
import type { Currency, Game } from '@/types'

/**
 * Launch contract (§8.2) — единый flow с карточки, из превью и из last played.
 * Обязательного выбора валюты перед спином нет: спрашиваем только если выбор реально существует.
 * Само решение принимает чистая функция `lib/launch-decision` (её проверяет приёмка),
 * хук только собирает контекст из сторов и выполняет решение.
 */

export { firstSupported }

function currentContext(): LaunchContext {
  const auth = useAuthStore.getState()
  const wallets = useWalletStore.getState()
  return {
    isAuthenticated: auth.isAuthenticated,
    activeCurrency: wallets.activeCurrency,
    wallets: wallets.wallets,
    lastPlayedCurrency: wallets.lastPlayedCurrency ?? undefined
  }
}

export function useLaunch() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setPending = useLaunchStore((state) => state.setPending)
  const setLaunching = useLaunchStore((state) => state.setLaunching)

  /** Решение по правилам §8.2 без обращения к сети. */
  const resolveDecision = useCallback(
    (game: Game): LaunchDecision => resolveLaunchDecision(game, currentContext()),
    []
  )

  const play = useCallback(
    async (game: Game, currency: Currency, options?: { demo?: boolean }) => {
      setLaunching(game.slug)
      try {
        const result = await casinoApi.launch({ slug: game.slug, currency, demo: options?.demo })
        if (!options?.demo) {
          const wallets = useWalletStore.getState()
          wallets.setLastPlayedCurrency(currency)
          wallets.setActiveCurrency(currency)
        }
        const target = result.url.startsWith('/')
          ? result.url
          : `/play/remote?url=${encodeURIComponent(result.url)}&currency=${currency}`
        router.push(target)
        return true
      } catch (error) {
        const apiError = error as ApiError
        // Ошибки запуска — отдельные экраны и шиты, не один общий toast (§8.4).
        if (apiError.code === 'insufficient_funds') {
          useUIStore.getState().openDeposit(currency)
        } else if (apiError.code === 'currency_not_supported') {
          const fallback = firstSupported(nonZeroCurrencies(currentContext()), game)
          setPending({
            game,
            decision: fallback
              ? { kind: 'switch', currency: fallback, supported: game.currencies }
              : { kind: 'unsupported', currency, supported: game.currencies }
          })
        } else if (apiError.code === 'not_authenticated') {
          useUIStore.getState().openLogin(`launch:${game.slug}`)
        } else {
          router.push(`/play/error?code=${apiError.code}&game=${game.slug}`)
        }
        return false
      } finally {
        setLaunching(null)
      }
    },
    [router, setLaunching, setPending]
  )

  /** Точка входа всех кнопок запуска на деньги. */
  const launch = useCallback(
    (game: Game) => {
      const decision = resolveDecision(game)
      if (decision.kind === 'play') {
        void play(game, decision.currency)
        return decision
      }
      if (decision.kind === 'login') {
        // Держим игру в pending — после входа launch продолжится, а не начнётся заново.
        setPending({ game, decision })
        useUIStore.getState().openLogin(`launch:${game.slug}`)
        return decision
      }
      setPending({ game, decision })
      return decision
    },
    [play, resolveDecision, setPending]
  )

  const launchDemo = useCallback((game: Game) => play(game, 'RUB', { demo: true }), [play])

  /** Выбор кошелька в шите «В ₽ пусто. Играть с 8 200 ₸?». */
  const confirmAlternative = useCallback(
    (game: Game, currency: Currency) => {
      useLaunchStore.getState().clearPending()
      useWalletStore.getState().setActiveCurrency(currency)
      void play(game, currency)
    },
    [play]
  )

  /** Продолжение launch после логина — не выкидываем на главную. */
  const continueAfterLogin = useCallback(
    (game: Game) => {
      useLaunchStore.getState().clearPending()
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(useAuthStore.getState().user?.id) })
      const decision = resolveDecision(game)
      if (decision.kind === 'play') void play(game, decision.currency)
      else if (decision.kind === 'login') useUIStore.getState().openLogin(`launch:${game.slug}`)
      else setPending({ game, decision })
    },
    [play, queryClient, resolveDecision, setPending]
  )

  /** Текст шита: «В ₽ пусто. Играть с 8 200 ₸?» */
  const switchQuestion = useCallback((currency: Currency, alternative: Currency) => {
    const context = currentContext()
    const activeSymbol = CURRENCY_ASSETS[currency].symbol
    const targetAmount = formatAmount(balanceOf(context, alternative), alternative, { context: 'wallet' })
    // «В ₽ пусто. Играть с 8 200 ₸?» — без обещаний и без конвертации.
    return switchQuestionKind(context, currency) === 'empty'
      ? `В ${activeSymbol} пусто. Играть с ${targetAmount}?`
      : `${activeSymbol} не поддерживается этой игрой. Играть с ${targetAmount}?`
  }, [])

  return { launch, launchDemo, play, confirmAlternative, continueAfterLogin, switchQuestion }
}
