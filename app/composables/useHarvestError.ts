interface HarvestErrorLike {
  details?: { name?: string, message?: string, details?: Record<string, string[] | string> }
}

/**
 * Error text for the harvest admin pages and the event imports (whose bundles the harvester makes).
 * Harvest errors and conflicts carry a message written for the admin (which site is paused, that
 * the crawler is not running, why a bundle was refused), and validation errors name the field, so
 * those are shown as sent; anything else gets the generic text.
 */
export const useHarvestError = () => {
  return (input: unknown): string => {
    const error = (input && typeof input === 'object' ? input : {}) as HarvestErrorLike
    const fields = error.details?.details
    if (error.details?.name === 'VALIDATION_FAILED' && fields) {
      const first = Object.values(fields)[0]
      if (first) return Array.isArray(first) ? String(first[0]) : String(first)
    }
    if (error.details?.message && /^(HARVEST|INVALID_INPUT|RESOURCE_CONFLICT)/.test(error.details.name ?? '')) return error.details.message
    return adminError(input)
  }
}
