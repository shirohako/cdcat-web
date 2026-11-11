<template>
  <CatalogSection :title="$t('album.section.tracklist')" :icon="ListMusic" size="sm" clip class="@container">
    <template v-if="discs.length" #actions>
      <!-- The 样式 menu: every layout at each density it offers, grouped by layout; a small drawing, the name and what
           it shows per row. A UiPopover rather than a UiMenu: the card clips what overflows it (for the sticky disc
           headers), and the popover is teleported out. It scrolls past 22rem or the screen's height. The header's
           buttons are `xs`, as big as the 编辑 button in the side column; the menu opens centred under its button,
           and on phones centred across the screen, as its button sits near the right edge (user asks, 2026-11-11). -->
      <UiPopover placement="bottom" phone-centred :label="t('album.tracklist.settings.style')" role="menu" class="max-h-[min(22rem,calc(100dvh-1rem))]! w-72 rounded-md! p-1!">
        <template #trigger="{ open, toggle, attrs }">
          <UiButton size="xs" :icon="activeStyle.icon" class="max-w-full min-w-0 gap-1.5" v-bind="attrs" aria-haspopup="menu" @click="toggle">
            <span class="flex min-w-0 items-center gap-1"><span class="truncate">{{ activeOption?.name }}</span><AlbumTracklistLabel size="mini">{{ activeOption?.tag }}</AlbumTracklistLabel></span>
            <ChevronDown :size="13" class="-ml-0.5 shrink-0 text-meta transition-transform duration-200" :class="open && 'rotate-180'" aria-hidden="true" />
          </UiButton>
        </template>
        <template #default="{ close }">
          <template v-for="(group, index) in styleGroups" :key="group.style">
            <UiMenuDivider v-if="index" />
            <UiMenuItem
              v-for="option in group.options"
              :key="option.key"
              role="menuitemradio"
              :aria-checked="option === activeOption"
              :active="option === activeOption"
              :hint="option.hint"
              hint-class="text-11 leading-[0.9375rem] text-meta/80"
              class="gap-3! py-1! pl-2!"
              @click="change({ style: option.style, density: option.density }); close()"
            >
              <template #leading>
                <AlbumTracklistThumb :layout="option.style" :density="option.density" class="w-10.5 shrink-0 ring-1 ring-line" />
              </template>
              <span class="flex items-center gap-1.5"><span class="truncate">{{ option.name }}</span><AlbumTracklistLabel size="mini">{{ option.tag }}</AlbumTracklistLabel></span>
              <template #trailing>
                <Check v-if="option === activeOption" :size="15" class="shrink-0" aria-hidden="true" />
              </template>
            </UiMenuItem>
          </template>
        </template>
      </UiPopover>
      <!-- 表格 · 完整 only, and only on a card wide enough for a table: the same tables in a dialog as wide as the window -->
      <span v-if="tableFull" class="hidden @min-[40rem]:contents">
        <UiButton size="xs" :icon="Maximize2" :label="t('album.tracklist.fullscreen')" @click="tableOpen = true" />
      </span>
      <!-- Always there, so the header doesn't change between albums; disabled when the titles have no other language. -->
      <UiButton
        size="xs"
        :disabled="!languages.length"
        :tooltip="languageTip"
        :aria-label="languageTip"
        class="gap-1.5 tabular-nums"
        :class="languageKey && '[--ui-btn-bg:color-mix(in_oklab,var(--primary)_16%,transparent)] [--ui-btn-color:var(--primary)] [--ui-btn-hover:color-mix(in_oklab,var(--primary)_24%,transparent)]'"
        @click="languageOpen = true"
      >
        <Languages :size="14" /><template v-if="languages.length">{{ languages.length }}</template>
      </UiButton>
      <UiButton size="xs" :icon="Settings2" :label="t('album.tracklist.settings.title')" @click="settingsOpen = true" />
    </template>

    <div v-if="discs.length" ref="list" :class="swapping && 'is-swapping'">
      <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
        <component :is="activeStyle.component" :key="prefs.style" :discs="view.discs" :density="prefs.density" />
      </Transition>
      <p class="mx-5 border-t border-line pb-3.5 pt-2.5 text-xs text-meta">{{ total }}</p>
    </div>

    <CatalogEmptyLine v-else :icon="ListMusic" :text="$t('album.empty.tracklist_title')" />
  </CatalogSection>

  <UiHoverCard :anchor="artistCard.anchor.value" :label="hoverArtist?.name" :text-inset="16" class="w-76 p-0!" @enter="artistCard.enter" @leave="artistCard.leave" @close="artistCard.close">
    <ArtistHoverCard v-if="hoverArtist" :artist="hoverArtist" :roles="view.artistRoles.get(hoverArtist.id)" />
  </UiHoverCard>

  <AlbumTracklistLanguageDialog v-if="languages.length" v-model="languageOpen" :language="languageKey" :languages="languages" @update:language="swapLanguage" />
  <AlbumTracklistSettingsDialog v-model="settingsOpen" :styles="styleOptions" :prefs="prefs" @update="change" />
  <!-- 表格 · 完整 full screen: every disc's table at the window's width, the headers sticking at the dialog's top. Before
       the lyrics dialog, which opens over it at the same layer. -->
  <UiDialog v-model="tableOpen" size="full" :title="t('album.section.tracklist')" :description="total">
    <div ref="dialogList" class="@container [--tl-top:0px]">
      <AlbumTracklistDisc v-for="disc in view.discs" :key="disc.id" :disc="disc" :anchor="false">
        <AlbumTracklistTableFull :disc="disc" :anchors="false" />
      </AlbumTracklistDisc>
    </div>
  </UiDialog>
  <UiHoverCard :anchor="dialogArtistCard.anchor.value" :label="dialogArtist?.name" :text-inset="16" class="w-76 p-0!" @enter="dialogArtistCard.enter" @leave="dialogArtistCard.leave" @close="dialogArtistCard.close">
    <ArtistHoverCard v-if="dialogArtist" :artist="dialogArtist" :roles="view.artistRoles.get(dialogArtist.id)" />
  </UiHoverCard>
  <LyricsModal v-model="showLyrics" :track-id="lyricsTarget.trackId" :title="lyricsTarget.title" :prefer="lyricsTarget.prefer" />

  <!-- The rows' more menu (清单 · 简洁): one for the list, under the "…" that opened it, teleported so the card's
       clipping can't cut it off. 查看歌词 as the lyrics buttons do (none for instrumentals); 分享 comes later. -->
  <UiPopover v-model:open="moreOpen" :reference="moreAnchor" placement="bottom-end" :label="t('album.tracklist.more')" role="menu" class="w-40 rounded-md! p-1!">
    <div ref="moreBox">
      <UiMenuItem :icon="FileText" :class="MORE_ITEM" :disabled="moreRow?.instrumental" @click="viewLyrics">{{ t('album.tracklist.view_lyrics') }}</UiMenuItem>
      <UiMenuDivider />
      <UiMenuItem :icon="Copy" :class="MORE_ITEM" @click="copyTitle">{{ t('album.tracklist.copy_title') }}</UiMenuItem>
      <UiMenuItem :icon="Link" :class="MORE_ITEM" @click="copyLink">{{ t('album.tracklist.copy_link') }}</UiMenuItem>
      <UiMenuItem :icon="Share2" :class="MORE_ITEM" disabled>{{ t('album.tracklist.share') }}</UiMenuItem>
    </div>
  </UiPopover>

  <!-- A track's credits by role, under its people button (清单 · 简洁): opens on hover or a tap, like the artist card.
       A role tag and its names per line, the tags in one column of at most 9rem. At most 20rem wide, where names and
       long job titles wrap, and 20rem tall (less on a short screen), past which it scrolls. The names link to their
       artists; they open no card of their own here, as one hover card shows at a time. On phones it keeps 1.5rem clear
       of the screen's edges (user ask, 2026-11-11), rather than the popovers' 0.5rem. -->
  <UiHoverCard :anchor="peopleCard.anchor.value" :label="peopleRow?.title" placement="bottom" arrow :edge="24" class="max-h-[min(20rem,calc(100dvh-1rem))]! min-h-20 w-max min-w-60 max-w-[min(20rem,calc(100vw-3rem))]! overflow-x-hidden p-3.5!" @enter="peopleCard.enter" @leave="peopleCard.leave" @close="peopleCard.close">
    <template v-if="peopleRow">
      <p class="mb-1.5 text-xs font-semibold text-meta">{{ t('album.tracklist.people_button', { count: peopleRow.people }) }}</p>
      <div class="grid grid-cols-[fit-content(9rem)_minmax(0,1fr)] gap-x-3">
        <template v-for="(group, index) in peopleRow.groups" :key="group.key">
          <div class="flex min-w-0 py-1.5" :class="index > 0 && 'border-t border-line'">
            <CatalogRoleTag :label="group.label" :tip="group.tip" :category="group.category" class="h-auto! min-h-[1.125rem] whitespace-normal! py-0.5 leading-[0.875rem] wrap-anywhere" />
          </div>
          <div class="flex min-w-0 py-1.5" :class="index > 0 && 'border-t border-line'">
            <AlbumTracklistPeople :people="group.people" class="min-w-0" />
          </div>
        </template>
      </div>
    </template>
  </UiHoverCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { TracklistStyleOption } from './tracklist/SettingsDialog.vue'
import type { AlbumBonus, AlbumDisc, TracklistLanguage } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import type { TracklistDensity, TracklistDisc, TracklistPrefs, TracklistRow } from '~/utils/tracklistView'
import { BookOpenText, Check, ChevronDown, Copy, FileText, Languages, Link, List, ListMusic, Maximize2, Settings2, Share2, Table2 } from '@lucide/vue'
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
 * The layouts, each with the densities it offers; a reader picks one 样式, a layout at one of its densities, from the
 * header menu or the settings. A layout is a component taking `{ discs, density }` that wraps each disc in
 * AlbumTracklistDisc and builds its rows from the shared row parts; adding one is a component, an entry here, its
 * drawing in AlbumTracklistThumb, its name under album.tracklist.styles and a hint per density under
 * album.tracklist.style_hints. Since 2026-11-11 内页 has only 完整 and 表格 no 简洁.
 */
const STYLES: Record<string, { component: Component, icon: Component, densities: readonly TracklistDensity[] }> = {
  list: { component: AlbumTracklistList, icon: List, densities: ['compact', 'comfy', 'full'] },
  booklet: { component: AlbumTracklistBooklet, icon: BookOpenText, densities: ['full'] },
  table: { component: AlbumTracklistTable, icon: Table2, densities: ['comfy', 'full'] },
}
/** 样式 that moved to another layout, so readers who had one keep its look: 表格 · 简洁 is 清单 · 简洁 since 2026-11-11. */
const MOVED: Record<string, Pick<TracklistPrefs, 'style' | 'density'>> = {
  'table.compact': { style: 'list', density: 'compact' },
}

const { t, locale } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteTrack } = useFavorites()
const route = useRoute()
const { titleIn, localeName, enumLabel, formatDuration, attributeText } = useCatalogDisplay()
const { roleName, roleTip, roleCategory, roleOrder, attributeName } = useCatalogSchema()

const { prefs, update } = useTracklistPrefs(Object.fromEntries(Object.entries(STYLES).map(([key, style]) => [key, style.densities])), MOVED)
const activeStyle = computed(() => STYLES[prefs.value.style] ?? STYLES.list!)

type StyleOption = TracklistStyleOption & { hint: string }
const styleGroups = computed(() => Object.entries(STYLES).map(([style, layout]) => ({
  style,
  options: layout.densities.map((density): StyleOption => ({
    key: `${style}.${density}`,
    style,
    density,
    name: t(`album.tracklist.styles.${style}`),
    tag: t(`album.tracklist.density.${density}`),
    hint: t(`album.tracklist.style_hints.${style}_${density}`),
  })),
})))
const styleOptions = computed(() => styleGroups.value.flatMap(group => group.options))
const activeOption = computed(() => styleOptions.value.find(option => option.style === prefs.value.style && option.density === prefs.value.density))

// ── Titles' language: starts in the UI language when the tracklist has names in it.
const languageKey = ref(defaultLanguageKey(props.languages, locale.value))
const languageTip = computed(() => {
  if (!props.languages.length) return t('album.tracklist.language_none')
  const chosen = props.languages.find(language => `${language.locale}|${language.kind}` === languageKey.value)
  return t('album.tracklist.language_button', { name: chosen ? localeName(chosen.locale) : t('album.tracklist.original') })
})
const languageOpen = ref(false)
const settingsOpen = ref(false)

// ── 表格 · 完整 in a dialog as wide as the window (user pick F2, 2026-11-11); it closes if the 样式 changes.
const tableFull = computed(() => prefs.value.style === 'table' && prefs.value.density === 'full')
const tableOpen = ref(false)
watch(tableFull, (on) => {
  if (!on) tableOpen.value = false
})

const view = computed(() => buildTracklist(
  { discs: props.discs, bonuses: props.bonuses, credits: props.credits, language: parseLanguageKey(languageKey.value), numbering: prefs.value.numbering },
  {
    titleIn,
    roleName,
    roleTip,
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
  const style = patch.style !== undefined && patch.style !== prefs.value.style
  if (style || (patch.density !== undefined && patch.density !== prefs.value.density)) hold(style ? 600 : 480)
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
const previewing = useContentPreview()
const toggleFavorite = async (row: TracklistRow) => {
  if (previewing) return
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
  if (previewing) return
  lyricsTarget.value = { trackId: row.id, title: row.title, prefer }
  showLyrics.value = true
}

// ── A track's credits, in a card under its people button: hover, a tap, a press or the keyboard opens it, and a tap,
// press or key on the same button again closes it.
const peopleCard = useHoverCard(list, '[data-people-card]', { enabled: !previewing, ownClicks: true })
const peopleRow = computed(() => rowsById.value.get(Number(peopleCard.current.value?.dataset.peopleCard)) ?? null)
const openPeople = (button: HTMLElement) => {
  if (!previewing && button.dataset.peopleCard) peopleCard.toggle(button)
}

// ── The rows' more menu: one popover, anchored on the "…" that opened it. Pressing the same "…" again closes it; a
// press on another one closes it (a press outside) and opens it there.
const moreOpen = ref(false)
const moreRow = shallowRef<TracklistRow | null>(null)
const moreAnchor = shallowRef<HTMLElement | null>(null)
const moreFor = ref<number | null>(null)
const moreBox = ref<HTMLElement | null>(null)
const openMore = (row: TracklistRow, button: HTMLElement) => {
  if (previewing) return
  if (moreOpen.value && moreFor.value === row.id) {
    moreOpen.value = false
    return
  }
  moreRow.value = row
  moreAnchor.value = button
  moreFor.value = row.id
  moreOpen.value = true
}
watch(moreOpen, (open) => {
  if (open) {
    // Into the menu for the keyboard; a mouse press shows no ring for it
    void nextTick(() => moreBox.value?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true }))
    return
  }
  moreFor.value = null
  // Escape or a choice leaves focus in the closing menu: back to the "…"
  const focused = document.activeElement
  if (!focused || focused === document.body || moreBox.value?.contains(focused)) moreAnchor.value?.focus({ preventScroll: true })
})

// Rows the size of the titles they act on: 13px text, 14px icons, 28px tall
const MORE_ITEM = 'gap-2! px-2.5! py-1! text-13! [&_svg]:size-3.5!'

const { showToast } = useToast()
const copy = async (text: string, done: string) => {
  moreOpen.value = false
  try {
    await navigator.clipboard.writeText(text)
    showToast(done)
  } catch {
    showToast(t('album.tracklist.copy_failed', { text }), 'error')
  }
}
const viewLyrics = () => {
  moreOpen.value = false
  if (moreRow.value) openLyrics(moreRow.value, 'original')
}
// The title as shown, in the chosen title language
const copyTitle = () => moreRow.value && copy(moreRow.value.title, t('album.tracklist.title_copied'))
const copyLink = () => moreRow.value && copy(`${window.location.origin}/tracks/${moreRow.value.id}`, t('album.tracklist.link_copied'))

provideTracklist({ prefs, locked: computed(() => Boolean(props.locked)), folded, toggleDisc, favoriting, toggleFavorite, openLyrics, openPeople, openMore, moreFor })

// ── The artist hover card, one for the whole list; titles have none (2026-11-02).
const artistCard = useHoverCard(list, '[data-artist-card]')
const hoverArtist = computed(() => view.value.artists.get(Number(artistCard.current.value?.dataset.artistCard)) ?? null)
// The full-screen tables sit outside the list, in the dialog: a card of their own
const dialogList = ref<HTMLElement | null>(null)
const dialogArtistCard = useHoverCard(dialogList, '[data-artist-card]')
const dialogArtist = computed(() => view.value.artists.get(Number(dialogArtistCard.current.value?.dataset.artistCard)) ?? null)

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
