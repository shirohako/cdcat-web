import type { DiscussionCategory, DiscussionCategorySummary } from '~/types/discussion'

/** Category colors, as complete class strings so Tailwind generates them. */
const CATEGORY_TONES: Record<string, { chip: string, dot: string, soft: string }> = {
  slate: { chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', soft: 'bg-slate-50 text-slate-600' },
  red: { chip: 'bg-red-50 text-red-700', dot: 'bg-red-500', soft: 'bg-red-50 text-red-600' },
  orange: { chip: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-600' },
  amber: { chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-600' },
  yellow: { chip: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500', soft: 'bg-yellow-50 text-yellow-600' },
  lime: { chip: 'bg-lime-50 text-lime-700', dot: 'bg-lime-500', soft: 'bg-lime-50 text-lime-600' },
  green: { chip: 'bg-green-50 text-green-700', dot: 'bg-green-500', soft: 'bg-green-50 text-green-600' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-600' },
  teal: { chip: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-600' },
  cyan: { chip: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-500', soft: 'bg-cyan-50 text-cyan-600' },
  sky: { chip: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', soft: 'bg-sky-50 text-sky-600' },
  blue: { chip: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', soft: 'bg-blue-50 text-blue-600' },
  indigo: { chip: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500', soft: 'bg-indigo-50 text-indigo-600' },
  violet: { chip: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-600' },
  purple: { chip: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500', soft: 'bg-purple-50 text-purple-600' },
  fuchsia: { chip: 'bg-fuchsia-50 text-fuchsia-700', dot: 'bg-fuchsia-500', soft: 'bg-fuchsia-50 text-fuchsia-600' },
  pink: { chip: 'bg-pink-50 text-pink-700', dot: 'bg-pink-500', soft: 'bg-pink-50 text-pink-600' },
  rose: { chip: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', soft: 'bg-rose-50 text-rose-600' },
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
