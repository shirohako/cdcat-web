<template>
  <div>
    <SkeletonStatus v-if="loading">
      <div class="flex gap-1.5">
        <div class="skeleton h-6 w-20 rounded-full" />
        <div class="skeleton h-6 w-24 rounded-full" />
      </div>
      <div class="mt-3 space-y-3 rounded-xl bg-sunken px-4 py-5 sm:px-6">
        <div v-for="line in 6" :key="line" class="skeleton h-3 rounded-full" :class="['w-4/5', 'w-full', 'w-2/3'][line % 3]" />
      </div>
    </SkeletonStatus>
    <p v-else-if="status === 'error' && !data" class="py-6 text-center text-sm text-danger">{{ localizeError(error) }}</p>

    <template v-else-if="editing">
      <LyricsForm
        :track-id="trackId"
        :lyric="editing === 'new' ? null : current"
        :originals="originals"
        @saved="onSaved"
        @cancel="editing = null"
      />
    </template>

    <UiEmpty v-else-if="!lyrics.length" :title="$t('album.empty.lyrics_title')" :description="$t('lyrics_ui.empty_hint')" :icon="FileText">
      <template v-if="canSubmit" #actions>
        <UiButton variant="primary" size="sm" :icon="Plus" @click="startNew">{{ $t('lyrics_ui.submit_lyrics_or_translation') }}</UiButton>
      </template>
    </UiEmpty>

    <template v-else>
      <div class="flex items-center gap-2">
        <div role="tablist" class="-my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
          <button
            v-for="lyric in lyrics"
            :key="lyric.id"
            type="button"
            role="tab"
            :aria-selected="lyric.id === selectedId"
            class="chip chip-sm shrink-0"
            :class="{ 'chip-selected': lyric.id === selectedId }"
            @click="selectedId = lyric.id"
          >
            {{ localeName(lyric.language) }}<span class="ml-1 opacity-70">{{ enumLabel('lyric_kind', lyric.kind) }}</span>
          </button>
        </div>
        <UiButton v-if="canSubmit" size="xs" :icon="Plus" class="shrink-0" @click="startNew">
          <span class="hidden sm:inline">{{ $t('lyrics_ui.submit_lyrics_or_translation') }}</span>
        </UiButton>
      </div>

      <div v-if="companions.length" class="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-meta">
        <Columns2 :size="13" class="text-meta" />
        <span class="mr-0.5">{{ $t('lyrics_ui.compare_with') }}</span>
        <button
          v-for="lyric in companions"
          :key="lyric.id"
          type="button"
          :aria-pressed="lyric.id === compareId"
          class="chip chip-sm"
          :class="{ 'chip-selected': lyric.id === compareId }"
          @click="compareId = lyric.id === compareId ? null : lyric.id"
        >
          {{ localeName(lyric.language) }}<span class="ml-1 opacity-60">{{ enumLabel('lyric_kind', lyric.kind) }}</span>
        </button>
      </div>

      <div v-if="current" class="mt-3">
        <div class="rounded-xl bg-sunken px-4 py-4 sm:px-6 sm:py-5">
          <div v-if="comparison" class="mb-3 hidden grid-cols-2 gap-x-8 border-b border-line pb-2 text-11 font-medium text-meta sm:grid">
            <span>{{ lyricLabel(current) }}</span>
            <span>{{ lyricLabel(comparison) }}</span>
          </div>
          <template v-for="(row, index) in rows" :key="index">
            <!-- A blank line in both texts separates stanzas. -->
            <div v-if="!row[0] && !row[1]" class="h-4" />
            <div v-else class="grid gap-x-8" :class="{ 'mb-1.5 sm:mb-0 sm:grid-cols-2': comparison }">
              <p class="whitespace-pre-wrap break-words text-15 leading-7 text-title">{{ row[0] }}</p>
              <p v-if="comparison" class="whitespace-pre-wrap break-words text-13 leading-6 text-meta sm:text-15 sm:leading-7">{{ row[1] }}</p>
            </div>
          </template>
        </div>

        <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-11 text-meta">
          <span v-if="current.creator">{{ $t('lyrics_ui.added_by', { name: current.creator.nickname || current.creator.username }) }}</span>
          <span v-if="current.translator">{{ $t('lyrics_ui.translator', { name: current.translator }) }}</span>
          <span v-if="current.is_ai_generated" class="rounded bg-warning/10 px-1.5 py-px font-medium text-warning">{{ $t('lyrics_ui.ai_generated') }}</span>
          <a v-if="current.source && isUrl(current.source)" :href="current.source" target="_blank" rel="noopener nofollow" class="max-w-[16rem] truncate transition-colors hover:text-primary" @click="openSource">{{ $t('lyrics_ui.source_label', { source: current.source }) }}</a>
          <span v-else-if="current.source" class="max-w-[16rem] truncate">{{ $t('lyrics_ui.source_label', { source: current.source }) }}</span>
          <span class="ml-auto flex items-center gap-1">
            <UiButton :to="`/lyrics/${current.id}/versions`" size="xs">{{ $t('versions.short', { version: current.version }) }}</UiButton>
            <template v-if="canSubmit">
              <UiButton size="xs" :icon="Pencil" :label="$t('common.edit')" @click="editing = 'edit'" />
              <UiButton variant="danger-soft" size="xs" :icon="Trash2" :label="$t('common.delete')" @click="remove" />
            </template>
          </span>
        </div>
      </div>
      <SkeletonStatus v-else class="mt-3 space-y-3 rounded-xl bg-sunken px-4 py-5 sm:px-6">
        <div v-for="line in 6" :key="line" class="skeleton h-3 rounded-full" :class="['w-4/5', 'w-full', 'w-2/3'][line % 3]" />
      </SkeletonStatus>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Lyric, LyricSummary } from '~/types/lyric'
import type { Revision } from '~/types/revision'
import { Columns2, FileText, Pencil, Plus, Trash2 } from '@lucide/vue'
import { lyricLines } from '~/utils/lyricText'

const props = defineProps<{
  trackId: number
  /** What to show first: the original (default) or a translation, one in the UI language when there is */
  prefer?: 'original' | 'translation'
}>()

const { $api } = useNuxtApp()
const { t, locale } = useI18n()
const { isAuthenticated, hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()
const { localeName, enumLabel } = useCatalogDisplay()
const { showToast } = useToast()
const { onClick: onExternalClick } = useExternalLink()

const request = usePageData(`track:${props.trackId}:lyrics`,
  ({ signal, background }) => $api<{ lyrics: LyricSummary[] }>(`/v1/tracks/${props.trackId}/lyrics`, { signal, progress: !background }))
const { data, status, error, loading, refresh } = request
const kindOrder = { original: 0, transliteration: 1, translation: 2 } as const
const lyrics = computed(() => [...(data.value?.lyrics ?? [])].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.language.localeCompare(b.language)))
const originals = computed(() => lyrics.value.filter(lyric => lyric.kind === 'original'))
const canSubmit = computed(() => isAuthenticated.value && hasPermission('content.submit'))

const selectedId = ref<number | null>(null)
const compareId = ref<number | null>(null)
const editing = ref<'new' | 'edit' | null>(null)
/**
 * What shows first: a translation in the interface language when there is one (it opens beside its original, so a
 * reader gets both), else the original. `prefer: 'translation'` takes any translation over the original.
 */
const firstPick = (list: LyricSummary[]) => {
  const translations = list.filter(lyric => lyric.kind === 'translation')
  const own = translations.find(lyric => lyric.language === locale.value)
  return props.prefer === 'translation' ? own ?? translations[0] ?? list[0] : own ?? list[0]
}
/** Translations open next to their original. */
const companionOf = (id: number | null) => {
  const lyric = lyrics.value.find(item => item.id === id)
  const translationOf = lyric && lyric.kind !== 'original' ? lyric.translation_of_id : null
  return translationOf && lyrics.value.some(item => item.id === translationOf) ? translationOf : null
}
const pick = (list: LyricSummary[]) => {
  selectedId.value = firstPick(list)?.id ?? null
  compareId.value = companionOf(selectedId.value)
}
// With the list already here (the page the server rendered, or a revisit), the pick is made before the first render,
// so the browser's first render matches the server's HTML.
if (lyrics.value.length) pick(lyrics.value)
watch(lyrics, (list) => {
  if (!list.some(lyric => lyric.id === selectedId.value)) pick(list)
})

const companions = computed(() => lyrics.value.filter(lyric => lyric.id !== selectedId.value))
watch(selectedId, () => { compareId.value = companionOf(selectedId.value) })

const texts = useLyricTexts(props.trackId)
const load = async (id: number | null) => {
  if (id && !texts.value[id]) texts.value[id] = await $api<Lyric>(`/v1/lyrics/${id}`)
}
watch([selectedId, compareId], ([a, b]) => Promise.all([load(a), load(b)]), { immediate: true })
// The server render carries the lyrics themselves, so search engines read them (docs/seo in the API repo). Watchers
// don't run there after the list arrives, so the pick and its texts are fetched here, before the HTML is written.
if (import.meta.server) {
  onServerPrefetch(async () => {
    await request
    pick(lyrics.value)
    await Promise.all([load(selectedId.value), load(compareId.value)]).catch(() => {})
  })
}

const current = computed(() => selectedId.value ? texts.value[selectedId.value] ?? null : null)
/** A source that is a web address opens behind the external link card. */
const openSource = (event: MouseEvent) => {
  const source = current.value?.source
  if (source) onExternalClick(event, { url: source })
}
const lyricLabel = (lyric: LyricSummary) => `${localeName(lyric.language)} · ${enumLabel('lyric_kind', lyric.kind)}`
const isUrl = (text: string) => /^https?:\/\//i.test(text)
const comparison = computed(() => compareId.value ? texts.value[compareId.value] ?? null : null)
/** Lines of the shown lyric, paired by position with the comparison. */
const rows = computed(() => {
  const left = current.value ? lyricLines(current.value.content, current.value.format) : []
  const right = comparison.value ? lyricLines(comparison.value.content, comparison.value.format) : []
  return Array.from({ length: Math.max(left.length, right.length) }, (_, index) => [left[index] ?? '', right[index] ?? ''])
})

const startNew = () => {
  if (!isAuthenticated.value) return navigateTo(`/auth/login?redirect=${encodeURIComponent(useRoute().fullPath)}`)
  editing.value = 'new'
}

const announce = (revision: Revision) => showToast(t(revision.status === 'approved' ? 'lyrics_ui.published' : 'lyrics_ui.pending_review'))

const onSaved = async (result: { revision: Revision, lyric: Lyric | null }) => {
  editing.value = null
  announce(result.revision)
  if (result.lyric) {
    texts.value[result.lyric.id] = result.lyric
    selectedId.value = result.lyric.id
  }
  await refresh()
}

const remove = async () => {
  if (!current.value || !confirm(t('lyrics_ui.delete_confirm'))) return
  try {
    const result = await $api<{ revision: Revision }>(`/v1/lyrics/${current.value.id}`, { method: 'DELETE' })
    announce(result.revision)
    if (result.revision.status === 'approved') {
      selectedId.value = null
      await refresh()
    }
  } catch (err) {
    showToast(localizeError(err), 'error')
  }
}
</script>
