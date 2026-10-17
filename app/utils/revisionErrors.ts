import type { RevisionConflict } from '~/types/revision'

type ApiFailure = { name?: string, details?: { name?: string, message?: string, details?: Record<string, unknown> } }

/** The error name of a failed API call, e.g. REVISION_CONFLICT. */
export const errorName = (error: unknown) => (error as ApiFailure)?.details?.name ?? (error as ApiFailure)?.name ?? null

/**
 * Field errors of a rejected revision as { path, message }. Paths look like
 * `items.<ref>.tracks.<row id>.title`; payload errors use Laravel's dotted names.
 */
export const revisionFieldErrors = (error: unknown): Array<{ path: string, message: string }> => {
  const details = (error as ApiFailure)?.details?.details
  if (!details || typeof details !== 'object') return []
  return Object.entries(details)
    .filter(([key]) => key !== 'conflicts')
    .map(([path, message]) => ({ path, message: Array.isArray(message) ? String(message[0]) : String(message) }))
}

/** Conflicts reported with REVISION_CONFLICT, each with the ref of its item. */
export const revisionConflicts = (error: unknown): RevisionConflict[] => {
  const details = (error as ApiFailure)?.details?.details as { conflicts?: RevisionConflict[] } | undefined
  return details?.conflicts ?? []
}

/** Whether a field error belongs under `prefix`, e.g. items.album.tracks.t1 */
export const errorsUnder = (errors: Array<{ path: string, message: string }>, prefix: string) =>
  errors.filter(error => error.path === prefix || error.path.startsWith(`${prefix}.`))
