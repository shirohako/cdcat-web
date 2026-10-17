<template>
  <CatalogSection :title="$t('album.section.tracklist')" :icon="ListMusic" tone="indigo">
    <template #actions>
      <select
        v-if="languages.length"
        v-model="languageKey"
        class="select select-sm h-8 text-xs max-w-44 text-xs text-gray-600"
        :aria-label="$t('album.tracklist.language')"
      >
        <option value="">{{ $t('album.tracklist.original') }}</option>
        <option v-for="language in languages" :key="language.key" :value="language.key">
          {{ language.label }} ({{ language.count }}/{{ language.total }})
        </option>
      </select>
      <NuxtLink
        v-if="albumId"
        :to="{ path: `/contribute/album/${albumId}`, query: { mode: 'translate', locale } }"
        class="hidden items-center gap-1 hover:text-gray-600 sm:flex"
        :title="$t('editor.mode_translate')"
      ><Languages :size="12" />{{ $t('album.tracklist.translate') }}</NuxtLink>
      <span class="hidden items-center gap-1 sm:flex"><Users :size="12" />{{ $t('album.tracklist.credits_toggle') }}</span>
      <input v-model="showCredits" type="checkbox" class="toggle scale-75" :aria-label="$t('album.tracklist.credits_toggle')">
    </template>

    <div v-if="discs.length">
      <template v-for="disc in discs" :key="disc.id">
        <div v-if="discs.length > 1 || disc.bonus || disc.format !== 'cd' || disc.title" :id="`disc-${disc.id}`" class="flex scroll-mt-20 items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 sm:px-5">
          <Disc3 :size="12" class="shrink-0 text-gray-400" />
          <span class="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-500">Disc {{ disc.position }}</span>
          <span v-if="disc.format !== 'cd'" class="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{{ enumLabel('disc_format', disc.format) }}</span>
          <span v-if="disc.shownTitle" class="truncate text-[11px] text-gray-500">— {{ disc.shownTitle }}</span>
          <span
            v-if="disc.bonus"
            class="tooltip tooltip-bottom shrink-0 cursor-default rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-600"
            :data-tip="disc.bonus.name"
          >{{ $t('content_display.bonus') }}</span>
          <span class="ml-auto shrink-0 rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-gray-500">{{ disc.tracks.length }}</span>
        </div>

        <div
          v-for="track in disc.tracks"
          :id="`track-${track.id}`"
          :key="track.id"
          class="group flex items-center gap-2 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-indigo-50/50 sm:gap-3 sm:px-5"
        >
          <span class="w-7 shrink-0 select-none text-right font-mono text-xs font-bold text-gray-400 group-hover:text-indigo-500">{{ track.number }}</span>

          <button
            v-if="!locked"
            type="button"
            :disabled="!!toggling[track.id]"
            class="shrink-0 cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
            :class="{ 'sm:opacity-100!': favorited[track.id] }"
            :title="$t(favorited[track.id] ? 'content_display.unfavorite' : 'content_display.favorite')"
            @click="toggleFavorite(track.id)"
          >
            <Heart :size="14" :fill="favorited[track.id] ? 'currentColor' : 'none'" :class="favorited[track.id] ? 'text-red-500' : 'text-gray-400'" />
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 flex-wrap items-center gap-1.5">
              <NuxtLink :to="`/tracks/${track.id}`" class="text-sm font-medium leading-snug hover:underline" :class="track.translated === false ? 'text-gray-500' : 'text-gray-900'">
                {{ track.shownTitle }}
              </NuxtLink>
              <span v-if="track.is_instrumental" class="tooltip tooltip-bottom shrink-0" :data-tip="$t('content_display.instrumental')">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600"><Music2 :size="11" :stroke-width="2.5" /></span>
              </span>
              <NuxtLink
                v-if="track.work && track.work.tracks_count > 1"
                :to="`/works/${track.work.id}`"
                class="tooltip tooltip-bottom shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
                :data-tip="$t('album.tracklist.other_recordings_hint')"
              >{{ $t('album.tracklist.other_recordings', { count: track.work.tracks_count - 1 }) }}</NuxtLink>
            </div>
            <p v-if="track.subtitle" class="mt-0.5 truncate text-xs text-gray-400">{{ track.subtitle }}</p>

            <div v-if="showCredits && (track.creditGroups.length || track.attributes.length)" class="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs">
              <div v-for="group in track.creditGroups" :key="group.role" class="flex items-baseline gap-2">
                <span class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold" :class="getAlbumRolePalette(group.category).badge">
                  {{ roleName(group.role) }}
                </span>
                <span class="text-gray-600">
                  <template v-for="(person, index) in group.people" :key="index">
                    <NuxtLink v-if="person.artistId" :to="`/artists/${person.artistId}`" class="hover:text-gray-800 hover:underline">{{ person.name }}</NuxtLink>
                    <span v-else>{{ person.name }}</span>
                    <span v-if="person.detail" class="text-gray-400"> ({{ person.detail }})</span>
                    <span v-if="index < group.people.length - 1">, </span>
                  </template>
                </span>
              </div>
              <CatalogAttributeList v-if="track.attributes.length" :attributes="track.attributes" class="pt-1" />
            </div>
          </div>

          <div class="flex shrink-0 flex-col items-center justify-center gap-1 sm:items-end">
            <span class="text-xs tabular-nums text-gray-400">{{ formatDuration(track.duration) || '--' }}</span>
            <button
              v-if="track.work && !track.is_instrumental"
              type="button"
              class="inline-flex cursor-pointer items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors"
              :class="track.work.lyrics_count ? 'bg-sky-50 text-sky-500 hover:bg-sky-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
              @click="openLyrics(track)"
            >
              <FileText :size="10" />
              <span class="hidden sm:inline">{{ $t('album.tracklist.lyric') }}</span>
              <span v-if="track.work.translations_count" class="text-teal-500">+{{ track.work.translations_count }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="flex items-center justify-center gap-3 px-6 py-5">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100"><ListMusic :size="15" class="text-indigo-400" /></div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-600">{{ $t('album.empty.tracklist_title') }}</p>
        <p class="mt-0.5 text-xs text-gray-500">{{ $t('album.empty.tracklist_desc') }}</p>
      </div>
    </div>
  </CatalogSection>

  <LyricsModal v-model="showLyrics" :work-id="lyricsTarget.workId" :title="lyricsTarget.title" />
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumTrack, TracklistLanguage } from '~/types/album'
import { Disc3, FileText, Heart, Languages, ListMusic, Music2, Users } from '@lucide/vue'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

const props = defineProps<{
  discs: AlbumDisc[]
  bonuses: AlbumBonus[]
  languages: TracklistLanguage[]
  /** Shows the link to the tracklist translator */
  albumId?: number
  /** Albums awaiting review cannot be favorited yet. */
  locked?: boolean
}>()

const { locale } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteTrack } = useFavorites()
const route = useRoute()
const { titleIn, localeName, enumLabel, formatDuration } = useCatalogDisplay()
const { roleName, roleCategory, roleOrder } = useCatalogSchema()

const UI_LOCALES: Record<string, string[]> = { 'zh-Hans': ['zh-Hans', 'zh-CN'], 'zh-Hant': ['zh-Hant', 'zh-TW'], en: ['en'], ja: ['ja'] }

const languages = computed(() => props.languages.map(language => ({
  ...language,
  key: `${language.locale}|${language.kind}`,
  label: `${localeName(language.locale)}${language.kind === 'transliteration' ? '' : ` · ${enumLabel('title_kind', language.kind)}`}`,
})))

/** Starts in the UI language when the tracklist has an official name or a translation in it. */
const languageKey = ref(languages.value.find(language => language.kind !== 'transliteration' && (UI_LOCALES[locale.value] ?? [locale.value]).includes(language.locale))?.key ?? '')
const chosen = computed(() => {
  if (!languageKey.value) return null
  const [code, kind] = languageKey.value.split('|') as [string, string]
  return { locale: code, kind }
})

const CREDITS_STORAGE_KEY = 'cdcat:tracklist:showCredits'
const showCredits = ref(true)
onMounted(() => {
  const saved = localStorage.getItem(CREDITS_STORAGE_KEY)
  if (saved !== null) showCredits.value = saved === 'true'
})
watch(showCredits, value => localStorage.setItem(CREDITS_STORAGE_KEY, String(value)))

interface CreditGroup { role: string, category: string, people: Array<{ name: string, artistId: number | null, detail: string | null }> }

const creditGroups = (track: AlbumTrack): CreditGroup[] => {
  const groups = new Map<string, CreditGroup>()
  for (const credit of track.credits) {
    const group = groups.get(credit.role) ?? { role: credit.role, category: credit.category ?? roleCategory(credit.role), people: [] }
    group.people.push({ name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, detail: credit.detail })
    groups.set(credit.role, group)
  }
  return [...groups.values()].sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
}

const discs = computed(() => props.discs.map(disc => ({
  ...disc,
  shownTitle: titleIn(disc.titles, chosen.value) ?? disc.title,
  bonus: props.bonuses.find(bonus => bonus.id === disc.bonus_id) ?? null,
  tracks: [...disc.tracks].sort((a, b) => a.track_number - b.track_number).map((track) => {
    const translated = titleIn(track.titles, chosen.value)
    return {
      ...track,
      number: track.number_label || String(track.track_number).padStart(2, '0'),
      shownTitle: translated ?? track.title,
      /** false when a language is chosen but this track has no name in it */
      translated: chosen.value ? translated !== null : null,
      subtitle: translated && translated !== track.title ? track.title : '',
      creditGroups: creditGroups(track),
    }
  }),
})))

const favorited = ref<Record<number, boolean>>(Object.fromEntries(props.discs.flatMap(disc => disc.tracks).filter(track => track.is_favorited).map(track => [track.id, true])))
const toggling = ref<Record<number, boolean>>({})

const toggleFavorite = async (trackId: number) => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (toggling.value[trackId]) return
  toggling.value = { ...toggling.value, [trackId]: true }
  try {
    const result = await setFavoriteTrack(trackId, !favorited.value[trackId])
    favorited.value = { ...favorited.value, [trackId]: result.favorited }
  } catch {
    // 401 已由 api 插件处理
  } finally {
    toggling.value = { ...toggling.value, [trackId]: false }
  }
}

const showLyrics = ref(false)
const lyricsTarget = ref<{ workId: number | null, title: string }>({ workId: null, title: '' })
const openLyrics = (track: { work: AlbumTrack['work'], shownTitle: string }) => {
  lyricsTarget.value = { workId: track.work?.id ?? null, title: track.shownTitle }
  showLyrics.value = true
}
</script>
