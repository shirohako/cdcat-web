<script setup lang="ts">
import { diffLines } from 'diff'
import { EyeOff, Loader2 } from '@lucide/vue'
import type { UserSummary } from '~/types/article'
import type { DiscussionRevision } from '~/types/discussion'

/**
 * A post's edit history: every recorded version with what changed from the one
 * before. Moderators can hide a version (e.g. one with personal details).
 */
const props = defineProps<{ postId: number | null, moderator?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { exact } = useRelativeTime()
const notice = useDiscussionNotice()
const { categoryName, flat } = useDiscussionCategories()
const { tags, tagName } = useTags()
const open = computed({ get: () => props.postId !== null, set: (value) => { if (!value) emit('close') } })
const loading = ref(false)
const revisions = ref<DiscussionRevision[]>([])
const current = ref<{ version: number, raw: string | null, edited_at: string | null, editor: UserSummary | null } | null>(null)

watch(() => props.postId, async (id) => {
  if (!id) return
  loading.value = true
  try {
    const response = await $api<{ revisions: DiscussionRevision[], current: NonNullable<typeof current.value> }>(`/v1/discussions/posts/${id}/revisions`)
    revisions.value = response.revisions
    current.value = response.current
  }
  catch (failure) {
    notice.error(localizeError(failure))
    emit('close')
  }
  finally {
    loading.value = false
  }
}, { immediate: true })

/** Versions newest first, each with the text that followed it, for the diff. */
const entries = computed(() => {
  const list = revisions.value.map((revision, index) => ({ revision, next: revisions.value[index + 1]?.raw ?? current.value?.raw ?? '' }))
  return list.reverse()
})

const diff = (before: string | null, after: string | null) => diffLines(before ?? '', after ?? '').flatMap(part => part.value.replace(/\n$/, '').split('\n')
  .map(line => ({ kind: part.added ? 'added' : part.removed ? 'removed' : 'same', line })))

const describeChange = (key: string, value: [unknown, unknown]) => {
  const [before, after] = value
  if (key === 'title') return t('discussions.history.changed_title', { before: String(before), after: String(after) })
  if (key === 'category') {
    const name = (id: unknown) => categoryName(flat.value.find(category => category.id === id)) || `#${id}`
    return t('discussions.history.changed_category', { before: name(before), after: name(after) })
  }
  if (key === 'tags') {
    const names = (ids: unknown) => (ids as number[]).map(id => { const tag = tags.value.find(item => item.id === id); return tag ? tagName(tag) : `#${id}` }).join('、') || '—'
    return t('discussions.history.changed_tags', { before: names(before), after: names(after) })
  }
  return t('discussions.history.changed_links')
}

async function setHidden(revision: DiscussionRevision, hidden: boolean) {
  try {
    await $api(`/v1/admin/discussions/revisions/${revision.id}`, { method: 'PATCH', body: { is_hidden: hidden } })
    revision.is_hidden = hidden
    notice.success(hidden ? t('discussions.history.hidden_done') : t('discussions.history.shown_done'))
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.history.title')" width="max-w-3xl">
    <div v-if="loading" class="flex justify-center py-10"><Loader2 :size="20" class="animate-spin text-slate-400" /></div>
    <ol v-else class="space-y-4">
      <li v-for="{ revision, next } in entries" :key="revision.id" class="rounded-xl border border-slate-200">
        <header class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span class="font-semibold text-slate-700">{{ t('discussions.history.edit_number', { n: revision.version }) }}</span>
          <span>{{ revision.editor?.nickname || revision.editor?.username }} · {{ exact(revision.created_at) }}</span>
          <span v-if="revision.reason" class="rounded bg-amber-50 px-1.5 text-amber-700">{{ t('discussions.history.reason', { reason: revision.reason }) }}</span>
          <span v-if="revision.is_hidden" class="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5"><EyeOff :size="11" />{{ t('discussions.history.hidden') }}</span>
          <button v-if="moderator" type="button" class="ml-auto text-indigo-600 hover:underline" @click="setHidden(revision, !revision.is_hidden)">
            {{ revision.is_hidden ? t('discussions.history.show') : t('discussions.history.hide') }}
          </button>
        </header>
        <ul v-if="revision.topic_changes" class="space-y-0.5 px-3 py-2 text-xs text-slate-600">
          <li v-for="(value, key) in revision.topic_changes" :key="key">{{ describeChange(String(key), value) }}</li>
        </ul>
        <p v-if="revision.raw === null" class="px-3 py-3 text-sm text-slate-400">{{ t('discussions.history.hidden_text') }}</p>
        <div v-else-if="revision.raw !== next" class="max-h-80 overflow-auto font-mono text-xs leading-5">
          <div v-for="(row, index) in diff(revision.raw, next)" :key="index" class="flex gap-2 px-3" :class="row.kind === 'added' ? 'bg-emerald-50 text-emerald-900' : row.kind === 'removed' ? 'bg-rose-50 text-rose-900 line-through decoration-rose-300' : 'text-slate-600'">
            <span class="w-3 shrink-0 select-none text-slate-400">{{ row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : '' }}</span>
            <span class="whitespace-pre-wrap break-all">{{ row.line || ' ' }}</span>
          </div>
        </div>
      </li>
      <li v-if="!entries.length" class="py-6 text-center text-sm text-slate-400">{{ t('discussions.history.empty') }}</li>
    </ol>
  </DiscussionDialog>
</template>
