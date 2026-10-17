<script setup lang="ts">
import type { AdminBatchResult, AdminPagination } from '~/types/admin'
import type { Revision } from '~/types/revision'

definePageMeta({ layout: 'admin', middleware: 'admin' })

/** A lyric revision of the patrol queue, with the lyric as it is now (null when it was deleted). */
type LyricRevision = Revision & {
  lyric: { id: number, work_id: number, kind: string, language: string, translator: string | null, is_ai_generated: boolean, created_by: number | null, work: { id: number, title: string } | null } | null
}

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const QUEUES = ['unchecked', 'pending', 'all'] as const
const queue = computed(() => (QUEUES as readonly string[]).includes(String(route.query.queue)) ? String(route.query.queue) : 'unchecked')
const flagged = computed(() => route.query.flagged === '1')
const workId = ref(String(route.query.work_id ?? ''))
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const setQuery = (patch: Record<string, string | undefined>) => router.push({ query: { ...route.query, page: undefined, ...patch } })
const query = computed(() => ({ queue: queue.value, flagged: flagged.value ? 1 : undefined, work_id: route.query.work_id || undefined, page: page.value }))

const { data, pending, error, refresh } = await useAsyncData('admin-lyric-patrol',
  () => $api<{ revisions: LyricRevision[], pagination: AdminPagination }>('/v1/admin/lyrics', { query: query.value }), { watch: [query] })
const revisions = computed(() => data.value?.revisions ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 20, current_page: 1, last_page: 1 })

const item = (revision: LyricRevision) => revision.items?.[0] ?? null
const flags = (revision: LyricRevision) => (revision.events ?? []).filter(event => event.action === 'flagged').map(event => event.comment).filter(Boolean)
/** The lyric text before and after this revision, from its changes. */
const content = (revision: LyricRevision) => {
  const change = item(revision)?.changes.find(op => op.path[0] === 'content')
  return change ? { before: String(change.from ?? ''), after: String(change.to ?? change.value ?? '') } : null
}
const otherChanges = (revision: LyricRevision) => (item(revision)?.changes ?? []).filter(op => op.path[0] !== 'content')
const show = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value)

const selected = ref<number[]>([])
watch(revisions, () => { selected.value = [] })
const checkable = (revision: LyricRevision) => revision.status === 'approved' && !revision.checked_at

const busy = ref(false)
const message = ref('')
const notice = ref('')
const run = async (request: () => Promise<unknown>, done: string) => {
  busy.value = true
  message.value = ''
  try {
    await request()
    notice.value = done
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure, 'admin_pages.revisions.action_failed')
  } finally {
    busy.value = false
  }
}
const check = (revision: LyricRevision) => run(() => $api(`/v1/admin/revisions/${revision.id}/check`, { method: 'POST' }), t('admin_pages.revisions.done_check'))
const approve = (revision: LyricRevision) => run(() => $api(`/v1/admin/revisions/${revision.id}/approve`, { method: 'POST', body: { lock_version: revision.lock_version } }), t('admin_pages.revisions.done_approve'))
const checkSelected = () => run(async () => {
  const result = await $api<AdminBatchResult>('/v1/admin/revisions/batch', { method: 'POST', body: { action: 'check', ids: selected.value } })
  if (result.failed) throw new Error(t('admin_pages.revisions.batch_summary', { succeeded: result.succeeded, failed: result.failed }))
}, t('admin_pages.revisions.done_check'))

const purgeTarget = ref<LyricRevision | null>(null)
const purgeOpen = computed({ get: () => purgeTarget.value !== null, set: (value) => { if (!value) purgeTarget.value = null } })
const purge = (reason: string) => {
  const lyric = purgeTarget.value?.lyric ?? null
  const lyricId = lyric?.id ?? item(purgeTarget.value!)?.resource_id
  purgeTarget.value = null
  if (lyricId) void run(() => $api(`/v1/admin/lyrics/${lyricId}/purge`, { method: 'POST', body: { reason } }), t('admin_pages.lyrics.purged'))
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => t('admin_pages.lyrics.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.lyrics.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.lyrics.description') }}</p>
    </header>

    <AdminFilterBar>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button
          v-for="value in QUEUES"
          :key="value"
          type="button"
          class="rounded-lg border px-3 py-2"
          :class="queue === value ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white'"
          @click="setQuery({ queue: value === 'unchecked' ? undefined : value })"
        >{{ t(`admin_pages.lyrics.queue_${value}`) }}</button>
        <label class="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2">
          <input type="checkbox" :checked="flagged" @change="setQuery({ flagged: ($event.target as HTMLInputElement).checked ? '1' : undefined })">{{ t('admin_pages.lyrics.flagged') }}
        </label>
        <form class="flex gap-2" @submit.prevent="setQuery({ work_id: workId.trim() || undefined })">
          <input v-model="workId" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.work_id')" :aria-label="t('admin_pages.content.work_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <button type="submit" class="rounded-lg border bg-white px-3 py-2">{{ t('admin_pages.apply') }}</button>
        </form>
        <button v-if="queue === 'unchecked'" type="button" :disabled="busy || !selected.length" class="ml-auto rounded-lg border border-emerald-300 bg-white px-3 py-2 text-emerald-700 disabled:opacity-40" @click="checkSelected">{{ t('admin_pages.lyrics.check_selected', { count: selected.length }) }}</button>
      </div>
    </AdminFilterBar>

    <p class="text-sm text-slate-500">{{ t('common.items_total', { count: pagination.total }) }}</p>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending" :error="error" :empty="!revisions.length" @retry="refresh()">
      <ul class="space-y-4">
        <li v-for="revision in revisions" :key="revision.id" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-start gap-3">
            <input v-if="checkable(revision)" v-model="selected" type="checkbox" :value="revision.id" class="mt-1" :aria-label="t('admin_pages.revisions.select', { id: revision.id })">
            <div class="min-w-0 flex-1">
              <p class="font-medium">
                <NuxtLink v-if="revision.lyric?.work" :to="`/works/${revision.lyric.work.id}`" target="_blank" class="underline decoration-slate-200 underline-offset-4">{{ revision.lyric.work.title }}</NuxtLink>
                <span v-else class="text-slate-400">{{ t('admin_pages.lyrics.deleted') }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ t(`admin_pages.content.lyric_kinds.${revision.lyric?.kind ?? 'original'}`) }} · {{ revision.lyric?.language ?? '—' }}<template v-if="revision.lyric?.is_ai_generated"> · AI</template></span>
              </p>
              <p class="mt-1 text-xs text-slate-500">
                <NuxtLink :to="`/admin/revisions/${revision.id}`" class="underline">#{{ revision.id }}</NuxtLink>
                · {{ t(`admin_pages.revisions.action_${item(revision)?.action ?? 'update'}`) }}
                · {{ revision.submitter?.nickname || revision.submitter?.username }} · {{ time(revision.submitted_at) }}
                <template v-if="revision.checked_at"> · {{ t('admin_pages.revisions.checked_at') }} {{ time(revision.checked_at) }}</template>
              </p>
              <p v-for="flag in flags(revision)" :key="flag ?? ''" class="mt-1 text-xs text-amber-700">⚑ {{ flag }}</p>
            </div>
            <RevisionStatusBadge :status="revision.status" />
          </div>

          <div class="mt-3 space-y-2">
            <AdminTextDiff v-if="content(revision)" :before="content(revision)!.before" :after="content(revision)!.after" />
            <p v-for="op in otherChanges(revision)" :key="op.path.join('.')" class="text-xs text-slate-600">
              <span class="font-mono">{{ op.path.join('.') }}</span>：{{ show(op.from) }} → {{ show(op.to ?? op.value) }}
            </p>
          </div>

          <div class="mt-3 flex flex-wrap gap-2 text-sm">
            <button v-if="checkable(revision)" type="button" :disabled="busy" class="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 disabled:opacity-40" @click="check(revision)">{{ t('admin_pages.revisions.check') }}</button>
            <button v-if="revision.status === 'pending'" type="button" :disabled="busy" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-40" @click="approve(revision)">{{ t('admin_pages.revisions.approve') }}</button>
            <NuxtLink v-if="revision.status === 'pending'" :to="`/admin/revisions/${revision.id}`" class="rounded-lg border px-3 py-1.5">{{ t('admin_pages.lyrics.review') }}</NuxtLink>
            <NuxtLink
              v-if="revision.lyric && item(revision)?.result_version && item(revision)!.result_version! > 1"
              :to="`/admin/content/lyrics/${revision.lyric.id}?restore=${item(revision)!.result_version! - 1}`"
              class="rounded-lg border px-3 py-1.5"
            >{{ t('admin_pages.lyrics.undo') }}</NuxtLink>
            <button type="button" :disabled="busy" class="ml-auto rounded-lg border border-red-300 px-3 py-1.5 text-red-700 disabled:opacity-40" @click="purgeTarget = revision">{{ t('admin_pages.lyrics.purge') }}</button>
          </div>
        </li>
      </ul>
      <footer class="mt-4"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>

    <AdminConfirmDialog v-model="purgeOpen" :busy="busy" reason-required :title="t('admin_pages.lyrics.purge')" :description="t('admin_pages.lyrics.purge_help')" @confirm="purge" />
  </div>
</template>
