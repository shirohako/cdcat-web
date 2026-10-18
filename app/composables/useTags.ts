import type { TagSummary } from '~/types/article'

export interface LibraryTag extends TagSummary {
  description: string | null
}

/** The shared tag library for the tag pickers, loaded once per page visit, with names in the current language. */
export const useTags = () => {
  const { $api } = useNuxtApp()
  const { locale } = useI18n()
  const { data, pending, refresh } = useAsyncData('community-tags',
    () => $api<{ tags: LibraryTag[] }>('/v1/tags').then(response => response.tags),
    { default: () => [] as LibraryTag[], getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })

  const tagName = (tag: TagSummary) => tag.translations?.[locale.value]?.name || tag.name

  return { tags: data, pending, refresh, tagName }
}
