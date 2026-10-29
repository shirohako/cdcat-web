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
  CONTENT_DELETE_BLOCKED: 'errors.codes.content_delete_blocked',
  DELETION_CONFIRMATION_REQUIRED: 'errors.codes.deletion_confirmation_required',
  DELETION_IMPACT_CHANGED: 'errors.codes.deletion_impact_changed',
  REVISION_NOT_OWNED: 'errors.codes.revision_not_owned',
  REVISION_ALREADY_PROCESSED: 'errors.codes.revision_already_processed',
  REVISION_NOT_EDITABLE: 'errors.codes.revision_not_editable',
  REVISION_CONFLICT: 'errors.codes.revision_conflict',
  REVISION_DRAFT_CONFLICT: 'errors.codes.revision_draft_conflict',
  REVISION_LIMIT: 'errors.codes.revision_limit',
  REVISION_ENTITY_NOT_FOUND: 'errors.codes.revision_entity_not_found',
  REVISION_INVALID_ACTION: 'errors.codes.revision_invalid_action',
  VERSION_NOT_FOUND: 'errors.codes.version_not_found',
  RESTORE_BLOCKED: 'errors.codes.restore_blocked',
  MERGE_BLOCKED: 'errors.codes.merge_blocked',
  MERGE_IMPACT_CHANGED: 'errors.codes.merge_impact_changed',
  IMAGE_INVALID: 'errors.codes.image_invalid',
  USER_SILENCED: 'errors.codes.user_silenced',
  CONTENT_PENDING: 'errors.codes.content_pending',
  REVISION_ITEM_APPLIED: 'errors.codes.revision_item_applied',
  DUPLICATE_SUSPECTED: 'errors.codes.duplicate_suspected',
  HARVEST_ARTISTS_CHANGED: 'errors.codes.harvest_artists_changed',
  REGISTRATION_CLOSED: 'errors.codes.registration_closed',
  UNDER_MINIMUM_AGE: 'errors.codes.under_minimum_age',
  OPERATION_IN_PROGRESS: 'errors.codes.operation_in_progress',
  JOB_NOT_RETRYABLE: 'errors.codes.job_not_retryable',
  ARTICLE_NOT_FOUND: 'errors.codes.article_not_found',
  ARTICLE_DRAFT_CONFLICT: 'errors.codes.article_draft_conflict',
  ARTICLE_INVALID_STATE: 'errors.codes.article_invalid_state',
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
  USER_BLOCK_NOT_ALLOWED: 'errors.codes.user_block_not_allowed',
  MAIL_LINK_INVALID: 'errors.codes.mail_link_invalid',
  MAIL_CATEGORY_REQUIRED: 'errors.codes.mail_category_required',
  MAIL_CATEGORY_IN_USE: 'errors.codes.mail_category_in_use',
  MAIL_CAMPAIGN_NOT_EDITABLE: 'errors.codes.mail_campaign_not_editable',
  MAIL_AUDIENCE_CHANGED: 'errors.codes.mail_audience_changed',
  MAIL_AUDIENCE_EMPTY: 'errors.codes.mail_audience_empty',
  MAIL_NOT_CONFIGURED: 'errors.codes.mail_not_configured',
  INVALID_CREDENTIALS: 'errors.codes.invalid_credentials',
  USER_INACTIVE: 'errors.codes.user_inactive',
  MAIL_SEND_FAILED: 'errors.codes.mail_send_failed',
  EMAIL_ALREADY_REGISTERED: 'errors.codes.email_already_registered',
  EMAIL_SAME_AS_CURRENT: 'errors.codes.email_same_as_current',
  VERIFICATION_CODE_COOLDOWN: 'errors.codes.verification_code_cooldown',
  VERIFICATION_CODE_INVALID: 'errors.codes.verification_code_invalid',
  VERIFICATION_CODE_EXPIRED: 'errors.codes.verification_code_expired',
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
