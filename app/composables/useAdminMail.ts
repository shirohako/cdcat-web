import type { AdminMailContents, AdminMailLocale } from '~/types/admin'

/** The mail languages, English first: every mail needs it, and it stands in for missing ones. */
export const ADMIN_MAIL_LOCALES: readonly AdminMailLocale[] = ['en', 'ja', 'zh-Hans', 'zh-Hant']

/** What group mail and group mail templates may use (CampaignService::variables()). */
export const ADMIN_MAIL_CAMPAIGN_VARIABLES = ['site_name', 'site_url', 'nickname', 'username']

const ERROR_TEXTS: Record<string, string> = {
  MAIL_CATEGORY_REQUIRED: '这类邮件是必收的，不能关闭。',
  MAIL_CATEGORY_IN_USE: '这个类型已经用于群发，不能删除，可以改为停用。',
  MAIL_CAMPAIGN_NOT_EDITABLE: '这封群发在当前状态下不能这样操作，请刷新后再试。',
  MAIL_AUDIENCE_CHANGED: '收件人数有变化（期间有人注册或退订），请核对新的人数，再输入一次确认。',
  MAIL_AUDIENCE_EMPTY: '按当前的类型和筛选条件，没有人会收到这封邮件。',
  MAIL_NOT_CONFIGURED: '服务器还没有配置群发：需要群发 mailer（MAIL_BULK_MAILER）和 APP_KEY。',
  RESOURCE_ALREADY_EXISTS: '已经存在，不用重复添加。',
  RESOURCE_CONFLICT: '当前状态下不能这样操作。',
  RATE_LIMIT_EXCEEDED: '操作太频繁，请稍后再试。测试邮件每人每小时最多 10 封。',
  VALIDATION_FAILED: '有内容没通过检查，请按提示修改后再试。',
}

type ApiFailure = { name?: string, details?: { name?: string, details?: Record<string, unknown> } }

/** A language version counts once both its subject and its body are written. */
export const filledMailLocales = (contents: AdminMailContents) =>
  ADMIN_MAIL_LOCALES.filter(locale => contents[locale]?.subject.trim() && contents[locale]?.body.trim())

/** Shared helpers of the admin mail pages: names, error messages and times. */
export const useAdminMail = () => {
  const errorName = (error: unknown) => (error as ApiFailure | undefined)?.name ?? (error as ApiFailure | undefined)?.details?.name
  /** The mail error codes in Chinese, else the site's usual message. */
  const mailError = (error: unknown) => {
    return ERROR_TEXTS[errorName(error) ?? ''] ?? adminError(error, '操作失败，请重试。')
  }
  /** Validation messages of a 422, keyed by field (`title`, `contents.en.body`…); empty for anything else. */
  const fieldErrors = (error: unknown): Record<string, string[]> => {
    const details = (error as ApiFailure | undefined)?.details?.details
    if (errorName(error) !== 'VALIDATION_FAILED' || !details) return {}
    return Object.fromEntries(Object.entries(details).map(([field, messages]) => [field, (Array.isArray(messages) ? messages : [messages]).map(String)]))
  }
  const localeName = (locale: string) => mailLocaleLabels[locale]
  const categoryName = (category: { key: string, names: Partial<Record<string, string>> } | null | undefined) =>
    category ? category.names['zh-Hans'] || category.names.en || category.key : '—'
  const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
  return { errorName, mailError, fieldErrors, localeName, categoryName, time }
}
