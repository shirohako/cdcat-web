import type { ArticleTypeDefinition } from '~/types/article'

/**
 * Article types from GET /article-types, maintained in the admin panel. Deactivated types are kept
 * for labelling articles that still have them; pickers offer `activeTypes` only.
 */
export const useArticleTypes = () => {
  const { $api } = useNuxtApp()
  const { localizedContent } = useLocaleFormatting()
  const { data, pending, refresh } = useAsyncData('article-types', () => $api<ArticleTypeDefinition[]>('/v1/article-types'),
    { default: () => [] as ArticleTypeDefinition[], getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })

  const byKey = computed(() => new Map(data.value.map(type => [type.key, type])))
  const activeTypes = computed(() => data.value.filter(type => type.is_active))
  /** The type's name in `language` (the UI language by default); unknown types show their key. */
  const typeName = (key: string, language?: string) => {
    const names = byKey.value.get(key)?.names
    return (language ? names?.[language] || names?.en : localizedContent(names)) || key.replaceAll('_', ' ')
  }

  return { types: data, activeTypes, pending, refresh, typeName, isType: (key: string) => byKey.value.has(key) }
}
