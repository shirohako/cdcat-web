import type { MarkdownEnv } from '~/utils/markdown'
import type { MarkdownCompleter, MarkdownCompletionItem } from '~/utils/markdownEditor'
import type { DiscussionReferences, DiscussionSuggestion } from '~/types/discussion'

const REF_TYPES = ['album', 'artist', 'entry', 'franchise', 'event', 'track', 'topic', 'article'] as const

/**
 * What the Markdown editor needs for discussions: preview references and `@` / `[[`
 * completion. `topicId` lists the topic's participants first after a bare `@`.
 */
export const useDiscussionAssist = (topicId?: MaybeRefOrGetter<number | null | undefined>) => {
  const { $api } = useNuxtApp()
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()

  const resolveEnv = async (raw: string): Promise<MarkdownEnv | null> => {
    if (!isAuthenticated.value) return null
    const response = await $api<{ references: DiscussionReferences }>('/v1/discussions/references', { method: 'POST', body: { raw } })
    return { references: response.references }
  }

  const complete: MarkdownCompleter = async (kind, query) => {
    if (!isAuthenticated.value) return []
    if (kind === 'mention') {
      const response = await $api<{ suggestions: { user: DiscussionSuggestion[] } }>('/v1/discussions/suggest', {
        query: { type: 'user', q: query || undefined, topic_id: toValue(topicId) || undefined },
      })
      return response.suggestions.user.map((user): MarkdownCompletionItem => ({
        label: `@${user.username}`, detail: user.title !== user.username ? user.title : null, apply: `@${user.username} `, image: user.image_url,
      }))
    }
    const typed = /^([a-z]+):(.*)$/.exec(query)
    const type = typed && (REF_TYPES as readonly string[]).includes(typed[1]!) ? typed[1] : undefined
    const q = (type ? typed![2]! : query).trim()
    if (!q) return []
    const response = await $api<{ suggestions: Record<string, DiscussionSuggestion[]> }>('/v1/discussions/suggest', { query: { q, type } })
    return Object.entries(response.suggestions).flatMap(([group, items]) => items.map((item): MarkdownCompletionItem => ({
      label: item.title,
      detail: [t(`markdown.refs.types.${group}`), item.subtitle].filter(Boolean).join(' · '),
      apply: `[[${group}:${item.id}]]`,
      image: item.image_url,
    })))
  }

  return { resolveEnv, complete }
}
