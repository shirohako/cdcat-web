import type { AdminMailContents, AdminMailLocale } from '~/types/admin'

/** The mail languages, English first: every mail needs it, and it stands in for missing ones. */
export const ADMIN_MAIL_LOCALES: readonly AdminMailLocale[] = ['en', 'ja', 'zh-Hans', 'zh-Hant']

/** What group mail and group mail templates may use (CampaignService::variables()). */
export const ADMIN_MAIL_CAMPAIGN_VARIABLES = ['site_name', 'site_url', 'nickname', 'username']

const ERROR_KEYS: Record<string, string> = {
  MAIL_CATEGORY_REQUIRED: 'admin_pages.mail.errors.category_required',
  MAIL_CATEGORY_IN_USE: 'admin_pages.mail.errors.category_in_use',
  MAIL_CAMPAIGN_NOT_EDITABLE: 'admin_pages.mail.errors.campaign_not_editable',
  MAIL_AUDIENCE_CHANGED: 'admin_pages.mail.errors.audience_changed',
  MAIL_AUDIENCE_EMPTY: 'admin_pages.mail.errors.audience_empty',
  MAIL_NOT_CONFIGURED: 'admin_pages.mail.errors.not_configured',
  RESOURCE_ALREADY_EXISTS: 'admin_pages.mail.errors.already_exists',
  RESOURCE_CONFLICT: 'admin_pages.mail.errors.conflict',
  RATE_LIMIT_EXCEEDED: 'admin_pages.mail.errors.rate_limited',
  VALIDATION_FAILED: 'admin_pages.mail.errors.invalid',
}

type ApiFailure = { name?: string, details?: { name?: string, details?: Record<string, unknown> } }

/** A language version counts once both its subject and its body are written. */
export const filledMailLocales = (contents: AdminMailContents) =>
  ADMIN_MAIL_LOCALES.filter(locale => contents[locale]?.subject.trim() && contents[locale]?.body.trim())

/** Shared helpers of the admin mail pages: names, error messages and times. */
export const useAdminMail = () => {
  const { t } = useAdminI18n()
  const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
  const errorName = (error: unknown) => (error as ApiFailure | undefined)?.name ?? (error as ApiFailure | undefined)?.details?.name
  /** The mail error codes in Chinese, else the site's usual message. */
  const mailError = (error: unknown) => {
    const key = ERROR_KEYS[errorName(error) ?? '']
    return key ? t(key) : localizeError(error, 'admin_pages.action_failed')
  }
  /** Validation messages of a 422, keyed by field (`title`, `contents.en.body`…); empty for anything else. */
  const fieldErrors = (error: unknown): Record<string, string[]> => {
    const details = (error as ApiFailure | undefined)?.details?.details
    if (errorName(error) !== 'VALIDATION_FAILED' || !details) return {}
    return Object.fromEntries(Object.entries(details).map(([field, messages]) => [field, (Array.isArray(messages) ? messages : [messages]).map(String)]))
  }
  const localeName = (locale: string) => t(`admin_pages.mail.locales.${locale}`)
  const categoryName = (category: { key: string, names: Partial<Record<string, string>> } | null | undefined) =>
    category ? category.names['zh-Hans'] || category.names.en || category.key : '—'
  const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
  return { t, errorName, mailError, fieldErrors, localeName, categoryName, time }
}
