'use client'

import { useEffect, useState } from 'react'

/** Экранирует клиентские значения (localStorage, активная валюта) от hydration mismatch. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
