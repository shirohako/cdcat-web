import type { Component } from 'vue'
import type { CatalogTitleKind } from '~/types/catalog'
import { BadgeCheck, Languages, Tags } from '@lucide/vue'

/**
 * The three sorts of other names the editors ask about instead of the five title kinds (EditorTitleRows, the album's
 * 新建翻译): official → official; translation → translation, or transliteration for a reading such as ja-Latn;
 * other → alias, or abbreviation when ticked. Each with its icon and colours.
 */
export type TitleGroup = 'official' | 'translation' | 'alias'

export const TITLE_GROUPS: Record<TitleGroup, { icon: Component, active: string, text: string, chip: string }> = {
  official: { icon: BadgeCheck, active: 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-200 dark:bg-blue-400/15 dark:ring-blue-400/25', text: 'text-blue-700 dark:text-blue-300', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300' },
  translation: { icon: Languages, active: 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:ring-emerald-400/25', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' },
  alias: { icon: Tags, active: 'border-meta bg-sunken ring-1 ring-line', text: 'text-title', chip: 'bg-btn text-btn-content' },
}

/** The tips under the question: how the three differ. */
export const TITLE_TIPS = ['shown', 'count', 'search', 'unsure'] as const

export const titleGroupOf = (kind: CatalogTitleKind): TitleGroup =>
  kind === 'official' ? 'official' : kind === 'translation' || kind === 'transliteration' ? 'translation' : 'alias'
