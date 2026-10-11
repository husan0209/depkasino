'use client'

import { useMediaQuery } from './useMediaQuery'

/** Колода и параллаксы уважают системную настройку (§4.4). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
