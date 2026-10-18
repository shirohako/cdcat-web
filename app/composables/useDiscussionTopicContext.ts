import type { InjectionKey, Ref } from 'vue'
import type { DiscussionPost, DiscussionReferences, DiscussionTopicDetail } from '~/types/discussion'

/**
 * What every post on a topic page shares: the topic, the merged references that
 * mentions, quotes and tokens render with, and the page-level dialogs. The topic
 * page and the article comment section provide it; post components inject it.
 */
export interface DiscussionTopicContext {
  topic: Ref<DiscussionTopicDetail>
  references: Ref<DiscussionReferences>
  focusId: Ref<number | null>
  mergeReferences: (references: DiscussionReferences | null | undefined) => void
  quote: (post: DiscussionPost, selection?: string) => void
  report: (post: DiscussionPost) => void
  moderate: (post: DiscussionPost) => void
  accept: (post: DiscussionPost | null) => Promise<void>
  /** Called after a post changed on the server, with its new state. */
  updated: (post: DiscussionPost) => void
  /** Called after a post was deleted for good; deleting #1 deletes the whole topic. */
  removed: (post: DiscussionPost, topicDeleted: boolean) => void
}

const KEY: InjectionKey<DiscussionTopicContext> = Symbol('discussion-topic')

export const provideDiscussionTopic = (context: DiscussionTopicContext) => provide(KEY, context)

export const useDiscussionTopic = () => {
  const context = inject(KEY)
  if (!context) throw new Error('useDiscussionTopic() needs a topic page or comment section above it')
  return context
}

/** Merges references group by group, so later pages add to what is already known. */
export const mergeDiscussionReferences = (target: DiscussionReferences, incoming: DiscussionReferences | null | undefined): DiscussionReferences => {
  if (!incoming) return target
  const merged: DiscussionReferences = { ...target }
  for (const [group, items] of Object.entries(incoming)) {
    if (items && typeof items === 'object' && !Array.isArray(items)) merged[group] = { ...(target[group] ?? {}), ...items }
  }
  return merged
}
