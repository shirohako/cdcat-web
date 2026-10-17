import type { TagSummary } from '~/types/article'

export interface TagWithCount extends TagSummary {
  description: string | null
  articles_count: number
}

/** The shared tag library, loaded once per page visit, with names in the current language. */
export const useTags = () => {
  const { $api } = useNuxtApp()
  const { locale } = useI18n()
  const { data, pending, refresh } = useAsyncData('community-tags',
    () => $api<{ tags: TagWithCount[] }>('/v1/tags').then(response => response.tags),
    { default: () => [] as TagWithCount[], getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })

  const tagName = (tag: TagSummary) => tag.translations?.[locale.value]?.name || tag.name

  return { tags: data, pending, refresh, tagName }
}
