import type { MaybeRefOrGetter, Ref } from 'vue'
import { breadcrumbLd, type LdRef } from '~/utils/structuredData'
import { descriptionLength, nameWithOriginal, truncateText } from '~/utils/seoText'

export interface PageSeoOptions {
  /** Without the site name; the title template adds "| CDCat". */
  title?: MaybeRefOrGetter<string | null | undefined>
  /** Plain text; cut to the locale's snippet length. */
  description?: MaybeRefOrGetter<string | null | undefined>
  image?: MaybeRefOrGetter<string | null | undefined>
  /** A wide image (banner, key visual, article cover): shared as a large card instead of a thumbnail. */
  wideImage?: boolean
  /**
   * The share card the backend drew for the page (1200×630 JPEG, docs/share-cards in the API repo). Shared
   * as a large card in place of `image`, which stays the fallback until the card exists.
   */
  card?: MaybeRefOrGetter<string | null | undefined>
  /** og:type, `website` by default. */
  type?: string
  noindex?: MaybeRefOrGetter<boolean | null | undefined>
  /** Adult content: indexed, but kept out of safe search. */
  adult?: MaybeRefOrGetter<boolean | null | undefined>
  /** The canonical path when it isn't the current one, e.g. an article's address with its slug. */
  path?: MaybeRefOrGetter<string | null | undefined>
  /**
   * Query parameters that are part of the page's address, `['page']` by default; any other one points the
   * canonical URL at the bare path. A function gives the canonical parameters outright.
   */
  query?: string[] | (() => Record<string, string | number | null | undefined>)
  jsonLd?: MaybeRefOrGetter<object | object[] | null | undefined>
  /** Section › this page; the site's home crumb is added in front. */
  breadcrumbs?: MaybeRefOrGetter<Array<{ name: string, path: string }> | null | undefined>
  /** The error of the page's main data: a 404 answers 404 and is never indexed. */
  error?: Ref<{ statusCode?: number } | null | undefined>
}

export const SITE_NAME = 'CDCat'

/** Parameters that never change what a page shows. */
const NEUTRAL_QUERY = /^(lang|l|utm_\w+|ref)$/

/** An absolute address on this site. */
export const useSiteUrl = () => {
  const config = useRuntimeConfig()
  const base = String(config.public.baseUrl || useRequestURL().origin)
  return (path: string) => (/^https?:\/\//.test(path) ? path : siteUrl(base, path))
}

/**
 * A public page's title, description, share card, canonical URL, robots and JSON-LD (docs/seo in the API
 * repo). Call it after the page's main `await`, so the server knows whether the data was found.
 */
export function usePageSeo(options: PageSeoOptions) {
  const route = useRoute()
  const { locale } = useI18n()
  const absolute = useSiteUrl()

  const missing = computed(() => options.error?.value?.statusCode === 404)
  if (import.meta.server && missing.value) setResponseStatus(useRequestEvent()!, 404)

  const noindex = computed(() => missing.value || !!toValue(options.noindex))
  const canonical = computed(() => {
    if (noindex.value) return undefined
    const params = new URLSearchParams()
    if (typeof options.query === 'function') {
      for (const [name, value] of Object.entries(options.query())) if (value !== null && value !== undefined && value !== '') params.set(name, String(value))
    } else {
      const keep = options.query ?? ['page']
      const filtered = Object.keys(route.query).some(name => !keep.includes(name) && !NEUTRAL_QUERY.test(name))
      for (const name of filtered ? [] : keep) {
        const value = route.query[name]
        if (typeof value === 'string' && value && !(name === 'page' && value === '1')) params.set(name, value)
      }
    }
    const search = params.toString()
    return absolute(`${toValue(options.path) || route.path}${search ? `?${search}` : ''}`)
  })

  const title = computed(() => toValue(options.title) || undefined)
  const description = computed(() => {
    const text = toValue(options.description)
    return text ? truncateText(text, descriptionLength(locale.value)) : undefined
  })
  const card = computed(() => {
    const url = toValue(options.card)
    return url ? absolute(url) : undefined
  })
  const image = computed(() => {
    const url = toValue(options.image)
    return card.value ?? (url ? absolute(url) : undefined)
  })

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: (options.type ?? 'website') as 'website',
    ogUrl: canonical,
    ogImage: image,
    ogImageWidth: () => (card.value ? 1200 : undefined),
    ogImageHeight: () => (card.value ? 630 : undefined),
    ogImageType: () => (card.value ? 'image/jpeg' as const : undefined),
    ogImageAlt: () => (image.value ? title.value : undefined),
    twitterCard: () => (image.value && (card.value || options.wideImage) ? 'summary_large_image' : 'summary'),
    robots: () => (noindex.value ? 'noindex, follow' : undefined),
  })

  const ld = computed(() => {
    if (noindex.value) return []
    const own = toValue(options.jsonLd)
    const crumbs = toValue(options.breadcrumbs)
    const trail: LdRef[] | null = crumbs?.length
      ? [{ name: SITE_NAME, url: absolute('/') }, ...crumbs.map(crumb => ({ name: crumb.name, url: absolute(crumb.path) }))]
      : null
    return [...(Array.isArray(own) ? own : own ? [own] : []), ...(trail ? [breadcrumbLd(trail)] : [])]
  })

  useHead(() => ({
    link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [],
    meta: toValue(options.adult) ? [{ name: 'rating', content: 'adult' }] : [],
    script: ld.value.map(data => ({
      type: 'application/ld+json',
      // `<` is escaped so text in the data can never close the script tag.
      innerHTML: JSON.stringify(data).replace(/</g, '\\u003c'),
    })),
  }))

  return { canonical, noindex }
}

/** Shared wording for titles and generated descriptions, in the page language. */
export const useSeoText = () => {
  const { t } = useI18n()
  /** "Local name (Original)" when they differ. */
  const withOriginal = (shown: string, original: string | null | undefined) =>
    nameWithOriginal(shown, original, (name, other) => t('seo.with_original', { name, original: other }))
  /** The non-empty parts as one sentence, with the locale's separator and full stop. */
  const sentence = (parts: Array<string | 0 | false | null | undefined>) => {
    const text = parts.filter(Boolean).join(t('seo.separator'))
    return text ? t('seo.sentence', { text: text.charAt(0).toLocaleUpperCase() + text.slice(1) }) : ''
  }
  /** Names joined as a list: "A、B" or "A, B". */
  const list = (names: Array<string | null | undefined>) => names.filter(Boolean).join(t('seo.list_separator'))
  /** "12 albums" style counts; nothing for zero. */
  const count = (key: string, value: number | null | undefined) => (value ? t(key, { count: value }, value) : '')
  return { withOriginal, sentence, list, count }
}
