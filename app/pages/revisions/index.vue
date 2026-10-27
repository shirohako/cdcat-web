<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold tracking-tight text-title">{{ $t('collection_pages.revisions.title') }}</h1>
          <p class="mt-1 text-sm text-meta">{{ $t('collection_pages.revisions.description') }}</p>
        </div>
        <NuxtLink to="/contribute/album" class="btn btn-primary btn-sm gap-1"><Plus :size="14" />{{ $t('revision_page.new_album') }}</NuxtLink>
      </header>

      <!-- Drafts kept in this browser; the list below holds submitted revisions only. -->
      <section v-if="localList.length" class="mb-8">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-title">
          <HardDrive :size="15" class="text-primary" />{{ $t('revision_page.local_title') }}<span class="text-xs font-normal text-meta">{{ localList.length }}</span>
        </h2>
        <p class="mb-3 mt-0.5 text-xs text-meta">{{ $t('revision_page.local_hint') }}</p>
        <ul class="space-y-2">
          <li v-for="item in localList" :key="item.key" class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3">
            <div class="min-w-0 flex-1">
              <NuxtLink v-if="draftEditorPath(item)" :to="draftEditorPath(item)!" class="font-semibold text-title transition-colors hover:text-primary">{{ item.label || $t('revision_page.local_untitled') }}</NuxtLink>
              <span v-else class="font-semibold text-title">{{ item.label || $t('revision_page.local_untitled') }}</span>
              <p class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-meta">
                <span class="rounded bg-card px-1.5 py-0.5 ring-1 ring-line">
                  {{ $t(`revision_page.action.${item.action}`) }} · {{ enumLabel('catalog_type', item.type) }}<template v-if="item.entityId"> #{{ item.entityId }}</template>
                </span>
                <span v-if="item.items.length > 1" class="rounded bg-card px-1.5 py-0.5 ring-1 ring-line">{{ $t('revision_page.local_items', { count: item.items.length }) }}</span>
                <span v-if="item.revisionId" class="rounded bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">{{ $t('revision_page.local_revision', { id: item.revisionId }) }}</span>
                <span class="text-meta">{{ $t('revision_page.local_saved', { at: ago(item.updatedAt) }) }}</span>
              </p>
            </div>
            <NuxtLink v-if="draftEditorPath(item)" :to="draftEditorPath(item)!" class="btn btn-sm">{{ $t('revision_page.continue') }}</NuxtLink>
            <button type="button" class="btn btn-ghost btn-sm text-danger" @click="discardLocal(item)">{{ $t('revision_page.delete_draft') }}</button>
          </li>
        </ul>
      </section>

      <nav class="mb-5 flex gap-1 overflow-x-auto pb-1">
        <button
          v-for="value in FILTERS"
          :key="value"
          type="button"
          class="chip shrink-0"
          :class="{ 'chip-selected': status === value }"
          @click="setStatus(value)"
        >{{ value === 'all' ? $t('revision_page.all') : $t(`revision_page.status.${value}`) }}</button>
      </nav>

      <CommonLoadError v-if="loadStatus === 'error' && data" class="mb-4" @retry="refresh()" />
      <SkeletonRows v-if="loading" page cards :count="4" />
      <p v-else-if="loadStatus === 'error' && !data" class="alert alert-error">{{ localizeError(error) }}</p>
      <div v-else-if="!revisions.length" class="card px-6 py-16 text-center">
        <GitPullRequest :size="28" class="mx-auto mb-3 text-faint" />
        <p class="text-sm text-meta">{{ $t('revision_page.empty') }}</p>
      </div>

      <CommonPagedList
        v-else
        v-model:page="page"
        :total-pages="lastPage"
        :total="data?.pagination.total ?? 0"
        :count="revisions.length"
        :per-page="data?.pagination.per_page ?? 1"
        :top-after="4"
        :disabled="refetching"
      >
        <ul class="space-y-3 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <li v-for="revision in revisions" :key="revision.id" class="card p-4">
            <div class="flex flex-wrap items-start gap-3">
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/revisions/${revision.id}`" class="font-semibold text-title transition-colors hover:text-primary">{{ heading(revision) }}</NuxtLink>
                <p v-if="revision.summary" class="mt-0.5 line-clamp-2 text-sm text-body">{{ revision.summary }}</p>
                <p class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-meta">
                  <span v-if="revision.kind === 'lyric'" class="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{{ $t('revision_page.kind.lyric') }}</span>
                  <span v-for="item in revision.items" :key="item.ref" class="rounded bg-btn px-1.5 py-0.5 text-btn-content">
                    {{ $t(`revision_page.action.${item.action}`) }} · {{ enumLabel('catalog_type', item.resource_type) }}<template v-if="item.resource_id"> #{{ item.resource_id }}</template>
                  </span>
                  <span class="text-meta">#{{ revision.id }} · {{ ago(revision.updated_at) }}</span>
                </p>
              </div>
              <RevisionStatusBadge :status="revision.status" />
            </div>
            <p v-if="revision.review_comment && ['changes_requested', 'rejected'].includes(revision.status)" class="mt-3 whitespace-pre-line rounded-lg bg-warning/10 px-3 py-2 text-sm text-body">
              <span class="font-medium text-warning">{{ $t('revision_page.review_comment') }}：</span>{{ revision.review_comment }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <NuxtLink v-if="isOpenRevision(revision.status) && editorPath(revision)" :to="editorPath(revision)!" class="btn btn-sm">{{ $t('revision_page.continue') }}</NuxtLink>
              <NuxtLink :to="`/revisions/${revision.id}`" class="btn btn-ghost btn-sm">{{ $t('common.details') }}</NuxtLink>
              <button v-if="revision.status === 'pending'" type="button" class="btn btn-ghost btn-sm text-danger" :disabled="busy === revision.id" @click="withdraw(revision)">{{ $t('revision_page.withdraw') }}</button>
            </div>
          </li>
        </ul>
      </CommonPagedList>
      <p v-if="message" class="mt-4 text-sm text-danger">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revision, RevisionStatus } from '~/types/revision'
import type { LocalDraft } from '~/utils/localDrafts'
import { GitPullRequest, HardDrive, Plus } from '@lucide/vue'
import { localDrafts } from '~/utils/localDrafts'
import { draftEditorPath, editorPath, isOpenRevision } from '~/utils/revisionLinks'

definePageMeta({ middleware: 'auth' })

const FILTERS = ['all', 'pending', 'changes_requested', 'approved', 'rejected', 'withdrawn'] as const

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { ago } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()
const { user } = useAuth()

/** Drafts kept in this browser (utils/localDrafts), newest first. */
const localList = ref<LocalDraft[]>([])
const loadLocal = async () => {
  if (user.value) localList.value = await localDrafts.list(user.value.id).catch(() => [])
}
onMounted(loadLocal)
const discardLocal = async (draft: LocalDraft) => {
  if (!confirm(t('revision_page.delete_confirm'))) return
  await localDrafts.remove(draft.userId, draft.scope).catch(() => undefined)
  await loadLocal()
}

const status = computed(() => (FILTERS as readonly string[]).includes(String(route.query.status)) ? String(route.query.status) as typeof FILTERS[number] : 'all')
const page = ref(Number(route.query.page) || 1)
const setStatus = (value: typeof FILTERS[number]) => {
  page.value = 1
  router.replace({ query: { ...route.query, status: value === 'all' ? undefined : value, page: undefined } })
}

// The reader's own revisions: always fetched fresh, and only in the browser.
const { data, status: loadStatus, error, refresh, loading, refetching } = await usePageData(
  () => `me:revisions-${status.value}-${page.value}`,
  ({ signal }) => $api<{ revisions: Revision[], pagination: { last_page: number, total: number, per_page: number } }>('/v1/me/revisions', {
    query: { status: status.value === 'all' ? undefined : status.value, page: page.value, per_page: 20 },
    signal,
  }),
  { cache: false, server: false },
)

const revisions = computed(() => data.value?.revisions ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)

/** "album: 名前" from the server, with the type in the UI language. */
const heading = (revision: Revision) => {
  const match = revision.title?.match(/^([a-z]+): (.*)$/)
  if (match) return `${enumLabel('catalog_type', match[1]!)} · ${match[2]}`
  return revision.title || `#${revision.id}`
}

const busy = ref<number | null>(null)
const message = ref('')
const act = async (revision: Revision, question: string, request: () => Promise<unknown>) => {
  if (!confirm(question)) return
  busy.value = revision.id
  message.value = ''
  try {
    await request()
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = null
  }
}
const withdraw = (revision: Revision) => act(revision, t('revision_page.withdraw_confirm'), () => $api(`/v1/revisions/${revision.id}/withdraw`, { method: 'POST' }))

const statusTitle = computed(() => status.value === 'all' ? '' : ` · ${t(`revision_page.status.${status.value as RevisionStatus}`)}`)
useSeoMeta({ title: () => `${t('collection_pages.revisions.title')}${statusTitle.value}`, robots: 'noindex' })
</script>
