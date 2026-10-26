import type { LocationQuery } from 'vue-router'

/**
 * The review queue's filters (docs/harvest/README.md#后台). They live in the page's query, and the
 * review page passes them on to the API, so previous / next stay within the same list.
 */
export const HARVEST_FILTER_KEYS = ['status', 'event_id', 'event_match', 'task_id', 'source', 'circle', 'complete', 'release_kind', 'duplicates', 'adult', 'q', 'sort', 'dir'] as const

export type HarvestFilterKey = typeof HARVEST_FILTER_KEYS[number]

export type HarvestFilters = Partial<Record<HarvestFilterKey, string>>

/** The filters in a route query, empty ones left out. */
export function harvestFilters(query: LocationQuery): HarvestFilters {
  const filters: HarvestFilters = {}
  for (const key of HARVEST_FILTER_KEYS) {
    const value = query[key]
    const text = Array.isArray(value) ? value[0] : value
    if (typeof text === 'string' && text !== '') filters[key] = text
  }
  return filters
}
