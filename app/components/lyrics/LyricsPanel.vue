<template>
  <div>
    <SkeletonStatus v-if="loading" class="space-y-3 py-2">
      <div class="flex gap-2">
        <div class="skeleton h-6 w-16 rounded-md" />
        <div class="skeleton h-6 w-20 rounded-md" />
      </div>
      <div v-for="line in 6" :key="line" class="skeleton h-3 rounded-full" :class="['w-4/5', 'w-full', 'w-2/3'][line % 3]" />
    </SkeletonStatus>
    <p v-else-if="status === 'error' && !data" class="py-6 text-center text-sm text-error">{{ localizeError(error) }}</p>

    <template v-else-if="editing">
      <LyricsForm
        :work-id="workId"
        :lyric="editing === 'new' ? null : current"
        :originals="originals"
        @saved="onSaved"
        @cancel="editing = null"
      />
    </template>

    <template v-else>
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <div v-if="lyrics.length" role="tablist" class="tabs-box tabs tabs-xs">
          <button
            v-for="lyric in lyrics"
            :key="lyric.id"
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': lyric.id === selectedId }"
            @click="selectedId = lyric.id"
          >
            {{ localeName(lyric.language) }}
            <span class="ml-1 text-[10px] opacity-60">{{ enumLabel('lyric_kind', lyric.kind) }}</span>
          </button>
        </div>
        <label v-if="selected && companions.length" class="flex items-center gap-1.5 text-xs text-gray-500">
          {{ $t('lyrics_ui.compare_with') }}
          <select v-model="compareId" class="select select-sm h-8 text-xs">
            <option :value="null">—</option>
            <option v-for="lyric in companions" :key="lyric.id" :value="lyric.id">{{ localeName(lyric.language) }} · {{ enumLabel('lyric_kind', lyric.kind) }}</option>
          </select>
        </label>
        <button v-if="canSubmit" type="button" class="btn btn-xs btn-primary ml-auto gap-1" @click="startNew">
          <Plus :size="12" />{{ $t('lyrics_ui.submit_lyrics_or_translation') }}
        </button>
      </div>

      <div v-if="!lyrics.length" class="py-10 text-center">
        <p class="text-sm font-semibold text-gray-600">{{ $t('album.empty.lyrics_title') }}</p>
        <p class="mt-1 text-xs text-gray-400">{{ $t('lyrics_ui.empty_hint') }}</p>
      </div>

      <div v-else-if="current">
        <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <span v-if="current.creator">{{ $t('lyrics_ui.added_by', { name: current.creator.nickname || current.creator.username }) }}</span>
          <span v-if="current.translator">{{ $t('lyrics_ui.translator', { name: current.translator }) }}</span>
          <span v-if="current.is_ai_generated" class="badge badge-ghost badge-xs">{{ $t('lyrics_ui.ai_generated') }}</span>
          <span v-if="current.source" class="truncate">{{ $t('lyrics_ui.source_label', { source: current.source }) }}</span>
          <NuxtLink :to="`/lyrics/${current.id}/versions`" class="hover:text-gray-600 hover:underline">{{ $t('versions.short', { version: current.version }) }}</NuxtLink>
          <template v-if="canSubmit">
            <button type="button" class="hover:underline" @click="editing = 'edit'">{{ $t('common.edit') }}</button>
            <button type="button" class="hover:underline text-error" @click="remove">{{ $t('common.delete') }}</button>
          </template>
        </div>
        <div class="grid gap-x-6 text-sm leading-7 text-gray-800" :class="comparison ? 'grid-cols-2' : 'grid-cols-1'">
          <template v-for="(line, index) in rows" :key="index">
            <p class="min-h-7 whitespace-pre-wrap">{{ line[0] }}</p>
            <p v-if="comparison" class="min-h-7 whitespace-pre-wrap text-gray-500">{{ line[1] }}</p>
          </template>
        </div>
      </div>
    </template>
    <CommonToast :toast="toast" />
  </div>
</template>

<script setup lang="ts">
import type { Lyric, LyricSummary } from '~/types/lyric'
import type { Revision } from '~/types/revision'
import { Plus } from '@lucide/vue'
import { lyricLines } from '~/utils/lyricText'

const props = defineProps<{ workId: number }>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const { isAuthenticated, hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()
const { localeName, enumLabel } = useCatalogDisplay()
const { toast, showToast } = useToast()

const { data, status, error, loading, refresh } = usePageData(`work:${props.workId}:lyrics`,
  ({ signal, background }) => $api<{ lyrics: LyricSummary[] }>(`/v1/works/${props.workId}/lyrics`, { signal, progress: !background }))
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
