import type { DiscussionCategory, DiscussionCategorySummary } from '~/types/discussion'

/** Category colors, as complete class strings so Tailwind generates them; each has a dark-theme partner. */
const CATEGORY_TONES: Record<string, { chip: string, dot: string, soft: string }> = {
  slate: { chip: 'bg-btn text-btn-content', dot: 'bg-meta', soft: 'bg-sunken text-body' },
  red: { chip: 'bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-300', dot: 'bg-red-500', soft: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300' },
  orange: { chip: 'bg-orange-50 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300', dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300' },
  amber: { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300' },
  yellow: { chip: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300', dot: 'bg-yellow-500', soft: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-300' },
  lime: { chip: 'bg-lime-50 text-lime-700 dark:bg-lime-400/15 dark:text-lime-300', dot: 'bg-lime-500', soft: 'bg-lime-50 text-lime-600 dark:bg-lime-400/10 dark:text-lime-300' },
  green: { chip: 'bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300', dot: 'bg-green-500', soft: 'bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-300' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300', dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' },
  teal: { chip: 'bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300', dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300' },
  cyan: { chip: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300', dot: 'bg-cyan-500', soft: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300' },
  sky: { chip: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300', dot: 'bg-sky-500', soft: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300' },
  blue: { chip: 'bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300', dot: 'bg-blue-500', soft: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300' },
  indigo: { chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300', dot: 'bg-indigo-500', soft: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300' },
  violet: { chip: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300', dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300' },
  purple: { chip: 'bg-purple-50 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300', dot: 'bg-purple-500', soft: 'bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300' },
  fuchsia: { chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', soft: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-400/10 dark:text-fuchsia-300' },
  pink: { chip: 'bg-pink-50 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300', dot: 'bg-pink-500', soft: 'bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300' },
  rose: { chip: 'bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300', dot: 'bg-rose-500', soft: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300' },
}

export const categoryTone = (color: string | null | undefined) => CATEGORY_TONES[color ?? ''] ?? CATEGORY_TONES.slate!

/** The category tree, loaded once per page visit, with names in the current language. */
export const useDiscussionCategories = () => {
  const { $api } = useNuxtApp()
  const { locale } = useI18n()
  const { data, pending, refresh } = useAsyncData('discussion-categories',
    () => $api<{ categories: DiscussionCategory[], can_moderate: boolean }>('/v1/discussions/categories'),
    { default: () => ({ categories: [] as DiscussionCategory[], can_moderate: false }), getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })

  const categories = computed(() => data.value?.categories ?? [])
  /** Every category, children right after their parent. */
  const flat = computed(() => categories.value.flatMap(category => [category, ...(category.children ?? [])]))
  const categoryName = (category: Pick<DiscussionCategorySummary, 'name' | 'translations'> | null | undefined) =>
    category ? category.translations?.[locale.value]?.name || category.name : ''
  const categoryDescription = (category: DiscussionCategory | null | undefined) =>
    category ? category.translations?.[locale.value]?.description || category.description || '' : ''

  return { categories, flat, pending, refresh, categoryName, categoryDescription, canModerate: computed(() => data.value?.can_moderate ?? false) }
}
