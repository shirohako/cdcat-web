import type { NotificationItem } from '~/types/article'

/** Discussion notifications that fold several people into one line. */
const GROUPED = ['discussion.topic_reply', 'discussion.watching', 'discussion.reaction']

/** How a notification reads, what extra line it shows, and where clicking it goes. */
export const useNotificationText = () => {
  const { t } = useI18n()

  const text = (notification: NotificationItem) => {
    const title = notification.data.title || t('article_ui.untitled')
    if (notification.type === 'report.resolved') {
      return t(notification.data.decision === 'accept' ? 'notifications.types.report_accepted' : 'notifications.types.report_dismissed', { title })
    }
    if (notification.type.startsWith('discussion.')) {
      const actor = notification.actor?.nickname || notification.actor?.username || t('common.anonymous')
      const params = { title, actor, count: notification.actor_count, floor: notification.data.floor ?? notification.data.parent_floor ?? '' }
      if (notification.type === 'discussion.moderation') return t(`notifications.types.discussion_moderation.${String(notification.data.action ?? 'edited')}`, params)
      const base = `notifications.types.${notification.type.replace('.', '_')}`
      return t(GROUPED.includes(notification.type) && notification.actor_count > 1 ? `${base}_many` : base, params)
    }
    const key = `notifications.types.${notification.type.replace('.', '_')}`
    const translated = t(key, { title })
    // Types this frontend does not know yet fall back to the title.
    return translated === key ? title : translated
  }

  /** A second line: the moderator's reason, or for discussion activity an excerpt of the post. */
  const detail = (notification: NotificationItem) => {
    if (notification.data.reason) return t('notifications.reason_line', { reason: notification.data.reason })
    if (notification.type.startsWith('discussion.') && typeof notification.data.excerpt === 'string') return notification.data.excerpt
    return null
  }

  const link = (notification: NotificationItem) => {
    const { type, id } = notification.subject
    if (!id) return null
    if (type === 'discussion_post') {
      const topicId = notification.data.topic_id
      if (!topicId || (notification.type === 'discussion.moderation' && notification.data.action === 'deleted')) return topicId ? `/discussions/${topicId}` : null
      return `/discussions/${topicId}?post=${id}`
    }
    if (type === 'discussion_topic') return notification.data.action === 'deleted' ? null : `/discussions/${id}`
    if (type === 'user') return null
    if (type !== 'article' || notification.type === 'article.deleted') return null
    if (notification.type === 'report.resolved') return notification.data.resolution === 'delete' ? null : `/articles/${id}`
    // The author fixes rejected or edited work in the writer; everything else opens the article.
    return ['article.rejected', 'article.unpublished', 'article.edited'].includes(notification.type) ? `/articles/${id}/edit` : `/articles/${id}`
  }

  return { text, detail, link }
}
