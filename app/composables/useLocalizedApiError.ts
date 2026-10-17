type ErrorLike = {
  name?: string
  code?: string | number
  status?: number
  statusCode?: number
  details?: {
    name?: string
    code?: string | number
    details?: Record<string, unknown>
  }
}

const ERROR_CODE_KEYS: Record<string, string> = {
  REVISION_STALE: 'errors.codes.revision_stale',
  REVISION_BASELINE_REQUIRED: 'errors.codes.revision_baseline_required',
  CONTENT_DELETE_BLOCKED: 'errors.codes.content_delete_blocked',
  DELETION_CONFIRMATION_REQUIRED: 'errors.codes.deletion_confirmation_required',
  DELETION_IMPACT_CHANGED: 'errors.codes.deletion_impact_changed',
  REVISION_NOT_OWNED: 'errors.codes.revision_not_owned',
  REVISION_CANNOT_RETRACT: 'errors.codes.revision_cannot_retract',
  REVISION_ALREADY_PROCESSED: 'errors.codes.revision_already_processed',
  REVISION_ROLLBACK_UNAVAILABLE: 'errors.codes.revision_rollback_unavailable',
  REVISION_ROLLBACK_BLOCKED: 'errors.codes.revision_rollback_blocked',
  ARTIST_MERGE_BLOCKED: 'errors.codes.artist_merge_blocked',
  ARTIST_MERGE_IMPACT_CHANGED: 'errors.codes.artist_merge_impact_changed',
  REGISTRATION_CLOSED: 'errors.codes.registration_closed',
  OPERATION_IN_PROGRESS: 'errors.codes.operation_in_progress',
  JOB_NOT_RETRYABLE: 'errors.codes.job_not_retryable',
  ARTICLE_NOT_FOUND: 'errors.codes.article_not_found',
  ARTICLE_DRAFT_CONFLICT: 'errors.codes.article_draft_conflict',
  ARTICLE_INVALID_STATE: 'errors.codes.article_invalid_state',
  ARTICLE_PENDING_LIMIT: 'errors.codes.article_pending_limit',
  CONTENT_BLOCKED: 'errors.codes.content_blocked',
  ALREADY_REPORTED: 'errors.codes.already_reported',
  RATE_LIMIT_EXCEEDED: 'errors.codes.rate_limit_exceeded',
  DISCUSSION_CATEGORY_NOT_FOUND: 'errors.codes.discussion_category_not_found',
  DISCUSSION_TOPIC_NOT_FOUND: 'errors.codes.discussion_topic_not_found',
  DISCUSSION_POST_NOT_FOUND: 'errors.codes.discussion_post_not_found',
  DISCUSSION_TOPIC_LOCKED: 'errors.codes.discussion_topic_locked',
  DISCUSSION_CATEGORY_CLOSED: 'errors.codes.discussion_category_closed',
  DISCUSSION_SILENCED: 'errors.codes.discussion_silenced',
  DISCUSSION_DUPLICATE_POST: 'errors.codes.discussion_duplicate_post',
  DISCUSSION_NEW_USER_LIMIT: 'errors.codes.discussion_new_user_limit',
  DISCUSSION_OWN_REACTION: 'errors.codes.discussion_own_reaction',
  DISCUSSION_TOPIC_HAS_REPLIES: 'errors.codes.discussion_topic_has_replies',
  USER_BLOCK_NOT_ALLOWED: 'errors.codes.user_block_not_allowed',
}

export const useLocalizedApiError = (translate?: (key: string, params?: Record<string, unknown>) => string) => {
  // This composable is also used by plugins and route middleware, where Vue's
  // useI18n() has no component setup context. Nuxt's injected composer is safe
  // in all of those contexts and remains reactive when the locale changes.
  const nuxtApp = useNuxtApp()
  const t = (key: string, params?: Record<string, unknown>) => {
    if (translate) return translate(key, params)
    return params ? nuxtApp.$i18n.t(key, params) : nuxtApp.$i18n.t(key)
  }

  const localizeError = (input: unknown, fallbackKey = 'errors.request_failed') => {
    const error = input && typeof input === 'object' ? input as ErrorLike : undefined
    const code = error?.name ?? error?.details?.name ?? error?.code ?? error?.details?.code
    const codeKey = code === undefined ? undefined : ERROR_CODE_KEYS[String(code)]
    if (codeKey) return t(codeKey)

    const status = error?.statusCode ?? error?.status
    if (status === 401) return t('errors.unauthorized')
    if (status === 403) return t('errors.forbidden')
    if (status === 404) return t('errors.not_found')
    if (status && status >= 500) return t('errors.server')
    return t(fallbackKey)
  }

  const localizeFieldErrors = (
    details: Record<string, unknown> | null | undefined,
    fieldLabel: (field: string) => string,
  ) => {
    if (!details) return []
    return Object.keys(details).map(field => t('errors.invalid_field', { field: fieldLabel(field) }))
  }

  return { localizeError, localizeFieldErrors }
}
