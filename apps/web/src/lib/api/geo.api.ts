import { http } from './client'
import type { GeoConfig } from '@/types'

/** GeoConfig по hostname зеркала (§2.6). */
export const geoApi = {
  get: () => http.get<GeoConfig>('/geo')
}
