type ErrorLike = {
  name?: string
  code?: string | number
  status?: number
  statusCode?: number
  details?: { name?: string, code?: string | number }
}

/** What the API's error codes mean, for the admin pages (Chinese only, so not through i18n; the site's own texts are errors.codes.*). */
const CODES: Record<string, string> = {
  CONTENT_DELETE_BLOCKED: '存在受保护的引用，不能删除。',
  DELETION_CONFIRMATION_REQUIRED: '请先预览删除影响并填写原因。',
  DELETION_IMPACT_CHANGED: '删除影响已变化，请重新预览并提交。',
  REVISION_NOT_OWNED: '这是别人的修订。',
  REVISION_ALREADY_PROCESSED: '该修订已被处理。',
  REVISION_NOT_EDITABLE: '这条修订在当前状态下不能修改。',
  REVISION_CONFLICT: '有人改了同样的内容。请先处理冲突，再重新提交。',
  REVISION_DRAFT_CONFLICT: '这份草稿在别处被修改过，请选择要保留的版本。',
  REVISION_LIMIT: '你未完成的修订太多了，请先完成或撤回一些。',
  REVISION_ENTITY_NOT_FOUND: '这条修订要编辑的内容已经不存在。',
  REVISION_INVALID_ACTION: '这条修订不能进行这个操作。',
  VERSION_NOT_FOUND: '这个版本不存在。',
  RESTORE_BLOCKED: '这个版本引用了已经不存在的内容，无法恢复。',
  MERGE_BLOCKED: '有修订正在编辑要合并的条目，暂时不能合并。',
  MERGE_IMPACT_CHANGED: '合并的影响范围变了，请重新预览。',
  IMAGE_INVALID: '无法使用这张图片。请检查格式、大小、尺寸或链接。',
  USER_SILENCED: '你暂时被限制发布这类内容。',
  CONTENT_PENDING: '内容还在审核中，通过审核后才能这样做。',
  REVISION_ITEM_APPLIED: '这一项已经上线，请直接编辑内容本身。',
  DUPLICATE_SUSPECTED: '可能和已有的专辑重复，请先确认。',
  REGISTRATION_CLOSED: '当前暂停注册。',
  UNDER_MINIMUM_AGE: '你还未达到注册年龄，暂时无法注册。',
  OPERATION_IN_PROGRESS: '相同的操作正在进行，请稍后再试。',
  JOB_NOT_RETRYABLE: '这个失败任务不能在后台重试。',
  ARTICLE_NOT_FOUND: '文章不存在或尚未发布。',
  ARTICLE_DRAFT_CONFLICT: '这篇草稿已在别处修改，请重新加载。',
  ARTICLE_INVALID_STATE: '文章当前的状态不允许这个操作。',
  CONTENT_BLOCKED: '内容包含不允许的词语。',
  ALREADY_REPORTED: '你已经举报过，正在等待处理。',
  RATE_LIMIT_EXCEEDED: '操作太频繁，请稍后再试。',
  DISCUSSION_CATEGORY_NOT_FOUND: '版块不存在。',
  DISCUSSION_TOPIC_NOT_FOUND: '主题不存在或已被删除。',
  DISCUSSION_POST_NOT_FOUND: '帖子不存在或已被删除。',
  DISCUSSION_TOPIC_LOCKED: '主题已锁定，不能回复或编辑。',
  DISCUSSION_CATEGORY_CLOSED: '这个版块现在不能发主题。',
  DISCUSSION_SILENCED: '你已被禁言，暂时不能发帖。',
  DISCUSSION_DUPLICATE_POST: '刚刚已经发过同样的内容了。',
  DISCUSSION_NEW_USER_LIMIT: '新用户的帖子最多 2 个链接、不能插图片、最多提及 3 人。',
  DISCUSSION_OWN_REACTION: '不能给自己的帖子点表情。',
  USER_BLOCK_NOT_ALLOWED: '不能屏蔽这个用户。',
  MAIL_LINK_INVALID: '链接无效，请登录后在账号设置里修改邮件设置。',
  MAIL_CATEGORY_REQUIRED: '这类邮件会发给所有用户，不能关闭。',
  MAIL_CATEGORY_IN_USE: '这个类型已经用于群发，不能删除，可以改为停用。',
  MAIL_CAMPAIGN_NOT_EDITABLE: '这封群发当前的状态不允许这样操作。',
  MAIL_AUDIENCE_CHANGED: '收件人数已经变化，请确认新的人数后重新提交。',
  MAIL_AUDIENCE_EMPTY: '没有人会收到这封邮件。',
  MAIL_NOT_CONFIGURED: '这台服务器还没有配置群发邮件。',
  INVALID_CREDENTIALS: '邮箱或密码不正确。',
  USER_INACTIVE: '该账号已被停用。',
}

/** An API failure as text for the admin pages: its code if known, else its HTTP status, else the fallback. */
export const adminError = (input: unknown, fallback = '请求失败，请重试。'): string => {
  const error = input && typeof input === 'object' ? input as ErrorLike : undefined
  const code = error?.name ?? error?.details?.name ?? error?.code ?? error?.details?.code
  const known = code === undefined ? undefined : CODES[String(code)]
  if (known) return known
  const status = error?.statusCode ?? error?.status
  if (status === 401) return '登录状态已失效，请重新登录。'
  if (status === 403) return '你没有执行此操作的权限。'
  if (status === 404) return '请求的资源不存在。'
  if (status && status >= 500) return '服务器发生错误，请稍后重试。'
  return fallback
}
