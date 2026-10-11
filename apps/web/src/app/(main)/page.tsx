import { HomeBlocks } from '@/components/casino/HomeBlocks'
import { getDeckGames, getNewGames, getPopularGames, getProviders } from '@/lib/data/catalog'

/** Витрина обновляется раз в минуту (§22). */
export const revalidate = 60

export default async function HomePage() {
  const [popular, fresh, providers, deck] = await Promise.all([
    getPopularGames(18),
    getNewGames(12),
    getProviders(),
    getDeckGames(8)
  ])

  // Социальное доказательство гостю: детерминированное число в пределах дня — без hydration mismatch.
  const playersToday = 1180 + (new Date().getUTCDate() % 9) * 173

  return (
    <HomeBlocks
      popular={popular}
      fresh={fresh}
      providers={providers}
      deck={deck}
      playersToday={playersToday}
      quickStart={popular.slice(0, 4)}
    />
  )
}
