<template>
  <CatalogSection :title="$t('album.section.tracklist')" :icon="ListMusic" size="sm" clip class="@container">
    <template v-if="discs.length" #actions>
      <UiSegmented
        :model-value="prefs.density"
        :items="densityItems"
        size="sm"
        collapse
        :label="t('album.tracklist.density.label')"
        @update:model-value="value => change({ density: value })"
      />
      <!-- Always there, so the header doesn't change between albums; disabled when the titles have no other language. -->
      <UiButton
        size="sm"
        :disabled="!languages.length"
        :tooltip="languageTip"
        :aria-label="languageTip"
        class="gap-1.5 px-2.5 tabular-nums"
        :class="languageKey && '[--ui-btn-bg:color-mix(in_oklab,var(--primary)_16%,transparent)] [--ui-btn-color:var(--primary)] [--ui-btn-hover:color-mix(in_oklab,var(--primary)_24%,transparent)]'"
        @click="languageOpen = true"
      >
        <Languages :size="15" /><template v-if="languages.length">{{ languages.length }}</template>
      </UiButton>
      <UiButton size="sm" :icon="Settings2" :label="t('album.tracklist.settings.title')" @click="settingsOpen = true" />
    </template>

    <div v-if="discs.length" ref="list" :class="swapping && 'is-swapping'">
      <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
        <component :is="activeStyle.component" :key="prefs.style" :discs="view.discs" :density="prefs.density" />
      </Transition>
      <p class="mx-5 border-t border-line pb-3.5 pt-2.5 text-xs text-meta">{{ total }}</p>
    </div>

    <CatalogEmptyLine v-else :icon="ListMusic" :text="$t('album.empty.tracklist_title')" />
  </CatalogSection>

  <UiHoverCard :anchor="trackCard.anchor.value" :label="hoverRow?.title" class="w-80" @enter="trackCard.enter" @leave="trackCard.leave" @close="trackCard.close">
    <AlbumTracklistTrackCard v-if="hoverRow" :row="hoverRow" />
  </UiHoverCard>
  <UiHoverCard :anchor="artistCard.anchor.value" :label="hoverArtist?.name" class="w-76" @enter="artistCard.enter" @leave="artistCard.leave" @close="artistCard.close">
    <ArtistHoverCard v-if="hoverArtist" :artist="hoverArtist" :roles="view.artistRoles.get(hoverArtist.id)" />
  </UiHoverCard>

  <AlbumTracklistLanguageDialog v-if="languages.length" v-model="languageOpen" :language="languageKey" :languages="languages" @update:language="swapLanguage" />
  <AlbumTracklistSettingsDialog v-model="settingsOpen" :styles="styleOptions" :prefs="prefs" @update="change" />
  <LyricsModal v-model="showLyrics" :track-id="lyricsTarget.trackId" :title="lyricsTarget.title" :prefer="lyricsTarget.prefer" />
</template>

<script setup lang="ts">
import type { Component, FunctionalComponent } from 'vue'
import type { AlbumBonus, AlbumDisc, TracklistLanguage } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import type { TracklistDensity, TracklistDisc, TracklistPrefs, TracklistRow } from '~/utils/tracklistView'
import { BookOpenText, Languages, List, ListMusic, Settings2, Table2 } from '@lucide/vue'
import { AlbumTracklistBooklet, AlbumTracklistList, AlbumTracklistTable } from '#components'
import { buildTracklist, defaultLanguageKey, parseLanguageKey } from '~/utils/tracklistView'

const props = defineProps<{
  discs: AlbumDisc[]
  bonuses: AlbumBonus[]
  languages: TracklistLanguage[]
  /** The album-wide credits, for each artist's roles in the artist hover card */
  credits?: CatalogCredit[]
  /** Albums awaiting review cannot be favorited yet. */
  locked?: boolean
}>()
const emit = defineEmits<{ favorited: [trackId: number, value: boolean] }>()

/**
 * The styles a reader can pick in the settings. A style is a component taking `{ discs, density }` that wraps each
 * disc in AlbumTracklistDisc and builds its rows from the shared row parts; adding one is a component, an entry here
 * and its names under album.tracklist.styles.
 */
const STYLES: Record<string, { component: Component, icon: Component }> = {
  list: { component: AlbumTracklistList, icon: List },
  booklet: { component: AlbumTracklistBooklet, icon: BookOpenText },
  table: { component: AlbumTracklistTable, icon: Table2 },
}

const { t, locale } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteTrack } = useFavorites()
const route = useRoute()
const { titleIn, localeName, enumLabel, formatDuration, attributeText } = useCatalogDisplay()
const { roleName, roleCategory, roleOrder, attributeName } = useCatalogSchema()

const { prefs, update } = useTracklistPrefs(Object.keys(STYLES))
const activeStyle = computed(() => STYLES[prefs.value.style] ?? STYLES.list!)
const styleOptions = computed(() => Object.entries(STYLES).map(([key, style]) => ({
  key,
  icon: style.icon,
  label: t(`album.tracklist.styles.${key}`),
  hint: t(`album.tracklist.styles.${key}_hint`),
})))

// Density icons: lines that get more detailed, the same drawing as the design board.
const glyph = (path: string): FunctionalComponent => () => h('svg', { 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [h('path', { d: path })])
const DENSITY_ICONS: Record<TracklistDensity, FunctionalComponent> = {
  compact: glyph('M4 5h16M4 9.67h16M4 14.33h16M4 19h16'),
  comfy: glyph('M4 5.5h16M4 9.5h10M4 14.5h16M4 18.5h10'),
  full: glyph('M4 4.5h16M8 9h12M8 13.5h12M8 18h7'),
}
const densityItems = computed(() => (['compact', 'comfy', 'full'] as const).map(value => ({ value, label: t(`album.tracklist.density.${value}`), icon: DENSITY_ICONS[value] })))

// ── Titles' language: starts in the UI language when the tracklist has names in it.
const languageKey = ref(defaultLanguageKey(props.languages, locale.value))
const languageTip = computed(() => {
  if (!props.languages.length) return t('album.tracklist.language_none')
  const chosen = props.languages.find(language => `${language.locale}|${language.kind}` === languageKey.value)
  return t('album.tracklist.language_button', { name: chosen ? localeName(chosen.locale) : t('album.tracklist.original') })
})
const languageOpen = ref(false)
const settingsOpen = ref(false)

const view = computed(() => buildTracklist(
  { discs: props.discs, bonuses: props.bonuses, credits: props.credits, language: parseLanguageKey(languageKey.value) },
  {
    titleIn,
    roleName,
    roleCategory,
    roleOrder,
    enumLabel,
    localeName,
    formatDuration,
    attribute: attribute => ({ label: attributeName(attribute.key), value: attributeText(attribute) }),
  },
))
const rowsById = computed(() => new Map(view.value.discs.flatMap(disc => disc.rows).map(row => [row.id, row])))

const total = computed(() => {
  const tracks = rowsById.value.size
  const discs = view.value.discs.length
  return discs > 1 ? t('album.tracklist.total', { discs, tracks }) : t('album.tracklist.total_tracks', { count: tracks })
})

// ── Keeping the reader's place while the list changes height.
const list = ref<HTMLElement | null>(null)
const { hold } = useScrollAnchor(list)

const change = (patch: Partial<TracklistPrefs>) => {
  if (patch.density !== undefined || patch.style !== undefined) hold(patch.style ? 600 : 480)
  update(patch)
}

/** Titles fade out together, change language, and fade back in. */
const swapping = ref(false)
let swapTimer: ReturnType<typeof setTimeout> | undefined
const swapLanguage = (key: string) => {
  if (key === languageKey.value) return
  clearTimeout(swapTimer)
  swapping.value = true
  swapTimer = setTimeout(() => {
    hold(300)
    languageKey.value = key
    swapping.value = false
  }, 90)
}
onBeforeUnmount(() => clearTimeout(swapTimer))

// ── Folded discs, favourites and lyrics, shared with the styles through the context.
const folded = ref(new Set<number>())
const toggleDisc = (disc: TracklistDisc, header: HTMLElement | null) => {
  hold(520, header)
  const next = new Set(folded.value)
  if (next.has(disc.id)) next.delete(disc.id)
  else next.add(disc.id)
  folded.value = next
}

const favoriting = ref(new Set<number>())
const toggleFavorite = async (row: TracklistRow) => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (favoriting.value.has(row.id)) return
  favoriting.value = new Set(favoriting.value).add(row.id)
  try {
    const result = await setFavoriteTrack(row.id, !row.favorited)
    emit('favorited', row.id, result.favorited)
  } catch {
    // 401 已由 api 插件处理
  } finally {
    const next = new Set(favoriting.value)
    next.delete(row.id)
    favoriting.value = next
  }
}

const showLyrics = ref(false)
const lyricsTarget = ref<{ trackId: number | null, title: string, prefer: 'original' | 'translation' }>({ trackId: null, title: '', prefer: 'original' })
const openLyrics = (row: TracklistRow, prefer: 'original' | 'translation') => {
  lyricsTarget.value = { trackId: row.id, title: row.title, prefer }
  showLyrics.value = true
}

provideTracklist({ prefs, locked: computed(() => Boolean(props.locked)), folded, toggleDisc, favoriting, toggleFavorite, openLyrics })

// ── Hover cards: one for titles and one for names, for the whole list.
const trackCard = useHoverCard(list, '[data-track-card]', { enabled: () => prefs.value.trackCard })
const artistCard = useHoverCard(list, '[data-artist-card]', { enabled: () => prefs.value.artistCard })
const hoverRow = computed(() => rowsById.value.get(Number(trackCard.current.value?.dataset.trackCard)) ?? null)
const hoverArtist = computed(() => view.value.artists.get(Number(artistCard.current.value?.dataset.artistCard)) ?? null)

// The old 显示制作人员 switch, replaced by the densities.
onMounted(() => {
  try {
    localStorage.removeItem('cdcat:tracklist:showCredits')
  } catch {
    // storage blocked
  }
})
</script>

<style scoped>
.is-swapping :deep(.tl-title) {
  opacity: 0;
  transition-duration: 80ms;
}
</style>
