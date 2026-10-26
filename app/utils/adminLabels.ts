/**
 * Labels of values that more than one admin page shows. The admin is Chinese only, so its text is
 * written in place rather than going through i18n.
 */
export const articleStatusLabels: Record<string, string> = { draft: '草稿', published: '已发布', hidden: '已隐藏', locked: '已锁定' }
export const artistTypeLabels: Record<string, string> = { person: '个人', group: '团队', company: '公司', virtual: '虚拟艺人', circle: '同人社团', character: '角色' }
export const auditResultLabels: Record<string, string> = { submitted: '已提交', success: '成功', failed: '失败' }
export const entityTypeLabels: Record<string, string> = { album: '专辑', artist: '艺术家', entry: '条目', franchise: '系列', track: '曲目', label: '厂牌', lyric: '歌词' }
/** Why a credited name or the circle is left to the reviewer (CreditMatcher), short enough for a badge. */
export const harvestPeopleWarningLabels: Record<string, string> = {
  namesake: '撞名', conflict: '可能是另一个人', pending: '同名的在审核中', circle_only: '同名的是社团', person_only: '同名的是个人',
  shop: '像是商店名', short: '名字太短', suspect: '名字可疑',
}
export const harvestStatusLabels: Record<string, string> = {
  pending: '待审',
  approving: '通过中',
  approved: '已建档',
  linked: '站内已有',
  rejected: '不收录',
  excluded: '非音乐',
  merged: '已合并',
  all: '全部',
}
export const imageConversionLabels: Record<string, string> = { pending: '等待转换', failed: '转换失败' }
export const lyricKindLabels: Record<string, string> = { original: '原文', translation: '翻译', transliteration: '注音' }
export const mailCampaignStatusLabels: Record<string, string> = { draft: '草稿', scheduled: '已定时', sending: '发送中', sent: '已发完', cancelled: '已取消' }
export const mailDeliveryStatusLabels: Record<string, string> = { delivered: '已送达', delayed: '延迟', bounced: '退信', complained: '投诉', none: '暂无回执' }
export const mailLocaleLabels: Record<string, string> = { en: 'English', ja: '日本語', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文' }
export const mailLogStatusLabels: Record<string, string> = { pending: '等待发送', sent: '已发送', failed: '失败', skipped: '跳过', cancelled: '已取消' }
export const mailTemplateKindLabels: Record<string, string> = { system: '系统模板', campaign: '群发模板' }
export const postStatusLabels: Record<string, string> = { visible: '正常', hidden: '已折叠' }
export const reportReasonLabels: Record<string, string> = {
  spam: '广告',
  abuse: '人身攻击或引战',
  spoiler: '未标剧透',
  off_topic: '离题或灌水',
  infringement: '侵权',
  illegal: '违法',
  other: '其他',
  filter: '关键词命中',
}
export const revisionActionLabels: Record<string, string> = { create: '新增', update: '编辑', delete: '删除' }
export const revisionOriginLabels: Record<string, string> = { manual: '手动', import: '导入', client: '抓轨软件', system: '系统' }
export const seriesOrientationLabels: Record<string, string> = { portrait: '竖版（5:7，场刊封面）', landscape: '横版（16:9）' }
export const suppressionReasonLabels: Record<string, string> = { hard_bounce: '硬退信', soft_bounce: '反复软退信', complaint: '投诉', manual: '手动添加' }
/** Audit log actions, keyed with `.` and `-` written as `_` (users.update → users_update). */
export const auditActionLabels: Record<string, string> = {
  users_update: '修改用户资料或状态',
  users_assign_role: '分配用户角色',
  users_revoke_tokens: '作废用户登录会话',
  users_send_reset: '发送密码重置验证码',
  users_clear_verification_limit: '清除验证码限制',
  users_bootstrap_admin: '建立初始超级管理员',
  users_bootstrap_staff: '建立初始管理员',
  users_reconcile_roles: '收敛用户角色',
  roles_create: '创建角色',
  roles_update: '修改角色',
  roles_delete: '删除角色',
  revisions_approve: '批准修订',
  revisions_reject: '驳回修订',
  revisions_retract: '撤回修订',
  content_delete: '删除内容',
  tracks_delete: '删除曲目',
  revisions_rollback: '回滚修订',
  content_recount: '重算统计',
  artists_merge: '合并艺术家',
  link_providers_create: '新建链接提供方',
  link_providers_update: '修改链接提供方',
  events_create: '新建活动',
  events_update: '修改活动',
  events_delete: '删除活动',
  event_series_create: '新建活动系列',
  event_series_update: '修改活动系列',
  event_series_delete: '删除活动系列',
  reviews_delete: '删除评价',
  reviews_hide: '隐藏评价',
  reviews_unhide: '取消隐藏评价',
  articles_update: '编辑文章',
  articles_delete: '删除文章',
  lyrics_create: '新增歌词',
  lyrics_update: '编辑歌词',
  lyrics_delete: '删除歌词',
  settings_update: '修改站点设置',
  system_retry_job: '重试失败任务',
  system_delete_failed_job: '删除失败任务',
  system_cache_clear: '清除缓存',
  system_test_mail: '发送测试邮件',
  articles_feature: '设为编辑推荐',
  articles_unfeature: '取消编辑推荐',
  articles_slug: '修改文章链接',
  tags_create: '新建标签',
  tags_update: '修改标签',
  tags_delete: '删除标签',
  tags_merge: '合并标签',
  word_filters_create: '新增关键词',
  word_filters_update: '修改关键词',
  word_filters_delete: '删除关键词',
  reports_resolve: '处理举报',
  revisions_request_changes: '退回修订',
  labels_merge: '合并厂牌',
  credit_roles_create: '新建角色',
  credit_roles_update: '修改角色',
  credit_roles_delete: '删除角色',
  article_types_create: '新建文章类型',
  article_types_update: '修改文章类型',
  article_types_delete: '删除文章类型',
  attribute_definitions_create: '新建属性定义',
  attribute_definitions_update: '修改属性定义',
  attribute_definitions_delete: '删除属性定义',
  lyrics_purge: '清除歌词',
  shouts_hide: '隐藏留言',
  shouts_unhide: '取消隐藏留言',
  shouts_delete: '删除留言',
  discussions_silence: '讨论区禁言',
  lyrics_silence: '限制改歌词',
  shouts_silence: '限制发留言',
  link_providers_delete: '删除链接提供方',
  articles_hide: '隐藏文章',
  articles_unhide: '重新公开文章',
  articles_lock: '锁定文章',
  articles_unlock: '解锁文章',
  mail_categories_create: '创建邮件类型',
  mail_categories_update: '修改邮件类型',
  mail_categories_delete: '删除邮件类型',
  mail_templates_create: '创建邮件模板',
  mail_templates_update: '修改邮件模板',
  mail_templates_delete: '删除邮件模板',
  mail_templates_reset: '恢复默认邮件文案',
  mail_campaigns_create: '创建群发',
  mail_campaigns_update: '修改群发',
  mail_campaigns_delete: '删除群发',
  mail_campaigns_duplicate: '复制群发',
  mail_campaigns_send: '开始群发',
  mail_campaigns_schedule: '定时群发',
  mail_campaigns_cancel: '取消群发',
  mail_campaigns_resume: '继续群发',
  mail_suppressions_create: '加入退信名单',
  mail_suppressions_delete: '移出退信名单',
  mail_test_send: '发测试邮件',
}
/** An audit action in words; one without a label shows as recorded. */
export const auditActionLabel = (value: string) => auditActionLabels[value.replace(/[.-]/g, '_')] ?? value
/** The dashboard's and the system page's heartbeats, and their states. */
export const heartbeatLabels: Record<string, string> = { 'scheduler': '调度器心跳', 'worker': '队列心跳' }
export const heartbeatStatusLabels: Record<string, string> = { 'healthy': '正常', 'stale': '已超时', 'unknown': '未知（尚无有效心跳）' }
