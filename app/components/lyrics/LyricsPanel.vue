<template>
  <div>
    <SkeletonStatus v-if="loading">
      <div class="flex gap-1.5">
        <div class="skeleton h-6 w-20 rounded-full" />
        <div class="skeleton h-6 w-24 rounded-full" />
      </div>
      <div class="mt-3 space-y-3 rounded-xl bg-gray-50 px-4 py-5 sm:px-6">
        <div v-for="line in 6" :key="line" class="skeleton h-3 rounded-full" :class="['w-4/5', 'w-full', 'w-2/3'][line % 3]" />
      </div>
    </SkeletonStatus>
    <p v-else-if="status === 'error' && !data" class="py-6 text-center text-sm text-error">{{ localizeError(error) }}</p>

    <template v-else-if="editing">
      <LyricsForm
        :track-id="trackId"
        :lyric="editing === 'new' ? null : current"
        :originals="originals"
        @saved="onSaved"
        @cancel="editing = null"
      />
    </template>

    <div v-else-if="!lyrics.length" class="flex flex-col items-center py-10 text-center">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50"><FileText :size="18" class="text-sky-400" /></div>
      <p class="mt-3 text-sm font-semibold text-gray-600">{{ $t('album.empty.lyrics_title') }}</p>
      <p class="mt-1 max-w-sm text-xs leading-5 text-gray-400">{{ $t('lyrics_ui.empty_hint') }}</p>
      <button v-if="canSubmit" type="button" class="btn btn-sm btn-primary mt-4 gap-1" @click="startNew">
        <Plus :size="14" />{{ $t('lyrics_ui.submit_lyrics_or_translation') }}
      </button>
    </div>

    <template v-else>
      <div class="flex items-center gap-2">
        <div role="tablist" class="-my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
          <button
            v-for="lyric in lyrics"
            :key="lyric.id"
            type="button"
            role="tab"
            :aria-selected="lyric.id === selectedId"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
            :class="lyric.id === selectedId ? 'bg-sky-600 text-white ring-sky-600' : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'"
            @click="selectedId = lyric.id"
          >
            {{ localeName(lyric.language) }}<span class="ml-1 opacity-70">{{ enumLabel('lyric_kind', lyric.kind) }}</span>
          </button>
        </div>
        <button v-if="canSubmit" type="button" class="btn btn-ghost btn-xs shrink-0 gap-1 text-sky-700" @click="startNew">
          <Plus :size="12" /><span class="hidden sm:inline">{{ $t('lyrics_ui.submit_lyrics_or_translation') }}</span>
        </button>
      </div>

      <div v-if="companions.length" class="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <Columns2 :size="13" class="text-gray-400" />
        <span class="mr-0.5">{{ $t('lyrics_ui.compare_with') }}</span>
        <button
          v-for="lyric in companions"
          :key="lyric.id"
          type="button"
          :aria-pressed="lyric.id === compareId"
          class="rounded-full px-2.5 py-0.5 transition-colors"
          :class="lyric.id === compareId ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="compareId = lyric.id === compareId ? null : lyric.id"
        >
          {{ localeName(lyric.language) }}<span class="ml-1 opacity-60">{{ enumLabel('lyric_kind', lyric.kind) }}</span>
        </button>
      </div>

      <div v-if="current" class="mt-3">
        <div class="rounded-xl bg-gray-50 px-4 py-4 sm:px-6 sm:py-5">
          <div v-if="comparison" class="mb-3 hidden grid-cols-2 gap-x-8 border-b border-gray-200/70 pb-2 text-[11px] font-medium text-gray-400 sm:grid">
            <span>{{ lyricLabel(current) }}</span>
            <span>{{ lyricLabel(comparison) }}</span>
          </div>
          <template v-for="(row, index) in rows" :key="index">
            <!-- A blank line in both texts separates stanzas. -->
            <div v-if="!row[0] && !row[1]" class="h-4" />
            <div v-else class="grid gap-x-8" :class="{ 'mb-1.5 sm:mb-0 sm:grid-cols-2': comparison }">
              <p class="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-900">{{ row[0] }}</p>
              <p v-if="comparison" class="whitespace-pre-wrap break-words text-[13px] leading-6 text-gray-500 sm:text-[15px] sm:leading-7">{{ row[1] }}</p>
            </div>
          </template>
        </div>

        <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <span v-if="current.creator">{{ $t('lyrics_ui.added_by', { name: current.creator.nickname || current.creator.username }) }}</span>
          <span v-if="current.translator">{{ $t('lyrics_ui.translator', { name: current.translator }) }}</span>
          <span v-if="current.is_ai_generated" class="rounded bg-amber-50 px-1.5 py-px font-medium text-amber-600">{{ $t('lyrics_ui.ai_generated') }}</span>
          <a v-if="current.source && isUrl(current.source)" :href="current.source" target="_blank" rel="noopener nofollow" class="max-w-[16rem] truncate hover:text-gray-600 hover:underline">{{ $t('lyrics_ui.source_label', { source: current.source }) }}</a>
          <span v-else-if="current.source" class="max-w-[16rem] truncate">{{ $t('lyrics_ui.source_label', { source: current.source }) }}</span>
          <span class="ml-auto flex items-center gap-1">
            <NuxtLink :to="`/lyrics/${current.id}/versions`" class="rounded px-1.5 py-0.5 hover:bg-gray-100 hover:text-gray-600">{{ $t('versions.short', { version: current.version }) }}</NuxtLink>
            <template v-if="canSubmit">
              <button type="button" class="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 hover:text-gray-600" :title="$t('common.edit')" :aria-label="$t('common.edit')" @click="editing = 'edit'"><Pencil :size="12" /></button>
              <button type="button" class="flex h-6 w-6 items-center justify-center rounded hover:bg-red-50 hover:text-error" :title="$t('common.delete')" :aria-label="$t('common.delete')" @click="remove"><Trash2 :size="12" /></button>
            </template>
          </span>
        </div>
      </div>
      <SkeletonStatus v-else class="mt-3 space-y-3 rounded-xl bg-gray-50 px-4 py-5 sm:px-6">
        <div v-for="line in 6" :key="line" class="skeleton h-3 rounded-full" :class="['w-4/5', 'w-full', 'w-2/3'][line % 3]" />
      </SkeletonStatus>
    </template>
    <CommonToast :toast="toast" />
  </div>
</template>

<script setup lang="ts">
import type { Lyric, LyricSummary } from '~/types/lyric'
import type { Revision } from '~/types/revision'
import { Columns2, FileText, Pencil, Plus, Trash2 } from '@lucide/vue'
import { lyricLines } from '~/utils/lyricText'

const props = defineProps<{ trackId: number }>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const { isAuthenticated, hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()
const { localeName, enumLabel } = useCatalogDisplay()
const { toast, showToast } = useToast()

const { data, status, error, loading, refresh } = usePageData(`track:${props.trackId}:lyrics`,
  ({ signal, background }) => $api<{ lyrics: LyricSummary[] }>(`/v1/tracks/${props.trackId}/lyrics`, { signal, progress: !background }))
const kindOrder = { original: 0, transliteration: 1, translation: 2 } as const
const lyrics = computed(() => [...(data.value?.lyrics ?? [])].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.language.localeCompare(b.language)))
const originals = computed(() => lyrics.value.filter(lyric => lyric.kind === 'original'))
const canSubmit = computed(() => isAuthenticated.value && hasPermission('content.submit'))

const selectedId = ref<number | null>(null)
const compareId = ref<number | null>(null)
const editing = ref<'new' | 'edit' | null>(null)
watch(lyrics, (list) => {
  if (!list.some(lyric => lyric.id === selectedId.value)) selectedId.value = list[0]?.id ?? null
}, { immediate: true })

const selected = computed(() => lyrics.value.find(lyric => lyric.id === selectedId.value) ?? null)
const companions = computed(() => lyrics.value.filter(lyric => lyric.id !== selectedId.value))
watch(selectedId, () => {
  // Translations open next to their original.
  const translationOf = selected.value?.translation_of_id
  compareId.value = selected.value?.kind === 'original'
    ? null
    : (translationOf && lyrics.value.some(lyric => lyric.id === translationOf) ? translationOf : null)
})

const texts = reactive<Record<number, Lyric>>({})
const load = async (id: number | null) => {
  if (id && !texts[id]) texts[id] = await $api<Lyric>(`/v1/lyrics/${id}`)
}
watch([selectedId, compareId], ([a, b]) => Promise.all([load(a), load(b)]), { immediate: true })

const current = computed(() => selectedId.value ? texts[selectedId.value] ?? null : null)
const lyricLabel = (lyric: LyricSummary) => `${localeName(lyric.language)} · ${enumLabel('lyric_kind', lyric.kind)}`
const isUrl = (text: string) => /^https?:\/\//i.test(text)
const comparison = computed(() => compareId.value ? texts[compareId.value] ?? null : null)
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
    texts[result.lyric.id] = result.lyric
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
