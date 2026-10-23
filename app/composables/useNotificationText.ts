import type { NotificationItem } from '~/types/article'

/** Discussion notifications that fold several people into one line. */
const GROUPED = ['discussion.topic_reply', 'discussion.watching', 'discussion.reaction']

/** How a notification reads, what extra line it shows, and where clicking it goes. */
export const useNotificationText = () => {
  const { t, te } = useI18n()

  /** Revision titles come as "album: 名前"; the type is shown in the UI language. */
  const revisionTitle = (title: unknown) => {
    const match = String(title ?? '').match(/^([a-z]+): (.*)$/)
    return match ? `${te(`catalog.catalog_type.${match[1]}`) ? t(`catalog.catalog_type.${match[1]}`) : match[1]} · ${match[2]}` : String(title ?? '')
  }

  const text = (notification: NotificationItem) => {
    if (notification.type === 'user.restricted') {
      const scope = String(notification.data.scope ?? 'discussions')
      return t(te(`notifications.types.user_restricted.${scope}`) ? `notifications.types.user_restricted.${scope}` : 'notifications.types.user_restricted.discussions')
    }
    if (notification.type.startsWith('revision.')) {
      return t(`notifications.types.${notification.type.replace('.', '_')}`, { title: revisionTitle(notification.data.title) })
    }
    const title = notification.data.title || t('article_ui.untitled')
    if (notification.type === 'report.resolved') {
      return t(notification.data.decision === 'accept' ? 'notifications.types.report_accepted' : 'notifications.types.report_dismissed', { title })
    }
    if (notification.type === 'article.liked') {
      const actor = notification.actor?.nickname || notification.actor?.username || t('common.anonymous')
      return t(notification.actor_count > 1 ? 'notifications.types.article_liked_many' : 'notifications.types.article_liked', { title, actor, count: notification.actor_count })
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
    if (notification.type.startsWith('revision.') && notification.data.comment) return t('notifications.comment_line', { comment: notification.data.comment })
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
    if (type === 'album_review') return notification.data.album_id ? `/albums/${notification.data.album_id}` : null
    if (type === 'shout') return notification.data.artist_id ? `/artists/${notification.data.artist_id}` : null
    if (type === 'revision') return `/revisions/${id}`
    if (type !== 'article' || notification.type === 'article.deleted') return null
    if (notification.type === 'report.resolved') return notification.data.resolution === 'delete' ? null : `/articles/${id}`
    // An article a moderator edited, hid or locked opens in the writer, where the author sees why; the rest open the article.
    return ['article.hidden', 'article.locked', 'article.unlocked', 'article.edited'].includes(notification.type) ? `/articles/${id}/edit` : `/articles/${id}`
  }

  return { text, detail, link }
}
