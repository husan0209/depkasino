'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    setMatches(list.matches)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    list.addEventListener('change', handler)
    return () => list.removeEventListener('change', handler)
  }, [query])

  return matches
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
export const useIsTabletUp = () => useMediaQuery('(min-width: 768px)')
