<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold tracking-tight text-title">{{ $t('collection_pages.revisions.title') }}</h1>
          <p class="mt-1 text-sm text-meta">{{ $t('collection_pages.revisions.description') }}</p>
        </div>
        <UiButton to="/contribute/album" variant="primary" size="sm" :icon="Plus">{{ $t('revision_page.new_album') }}</UiButton>
      </header>

      <!-- Drafts kept in this browser and those saved to CDCat, one row per draft; the list below holds submitted revisions only. -->
      <section v-if="draftRows.length" class="mb-8">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-title">
          <HardDrive :size="15" class="text-primary" />{{ $t('revision_page.local_title') }}<span class="text-xs font-normal text-meta">{{ draftRows.length }}</span>
        </h2>
        <p class="mb-3 mt-0.5 text-xs text-meta">{{ $t('revision_page.local_hint') }}</p>
        <ul class="space-y-2">
          <li v-for="row in draftRows" :key="row.scope" class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3">
            <div class="min-w-0 flex-1">
              <NuxtLink v-if="draftEditorPath(row)" :to="draftEditorPath(row)!" class="font-semibold text-title transition-colors hover:text-primary">{{ row.label || $t('revision_page.local_untitled') }}</NuxtLink>
              <span v-else class="font-semibold text-title">{{ row.label || $t('revision_page.local_untitled') }}</span>
              <p class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-meta">
                <span class="rounded bg-card px-1.5 py-0.5 ring-1 ring-line">
                  {{ $t(`revision_page.action.${row.action}`) }} · {{ enumLabel('catalog_type', row.type) }}<template v-if="row.entityId"> #{{ row.entityId }}</template>
                </span>
                <span v-if="row.local && row.local.items.length > 1" class="rounded bg-card px-1.5 py-0.5 ring-1 ring-line">{{ $t('revision_page.local_items', { count: row.local.items.length }) }}</span>
                <span v-if="row.revisionId" class="rounded bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">{{ $t('revision_page.local_revision', { id: row.revisionId }) }}</span>
                <span v-if="row.local" class="inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 ring-1 ring-line"><HardDrive :size="11" />{{ $t('revision_page.on_device') }}</span>
                <span v-if="row.server" class="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-primary"><Cloud :size="11" />{{ $t('revision_page.on_server') }}</span>
                <span v-if="row.serverNewer" class="rounded bg-info/10 px-1.5 py-0.5 text-info">{{ $t('revision_page.server_newer') }}</span>
                <span v-if="row.server?.updated_via === 'mcp'" class="rounded bg-info/10 px-1.5 py-0.5 text-info">{{ $t('revision_page.server_mcp') }}</span>
                <span class="text-meta">{{ $t('revision_page.local_saved', { at: ago(row.updatedAt) }) }}</span>
                <span v-if="row.expiresIn !== null" class="text-meta">· {{ $t('revision_page.server_expires', { count: row.expiresIn }, row.expiresIn) }}</span>
              </p>
            </div>
            <UiButton v-if="draftEditorPath(row)" :to="draftEditorPath(row)!" size="sm">{{ $t('revision_page.continue') }}</UiButton>
            <UiButton variant="danger-soft" size="sm" @click="discardDraft(row)">{{ $t('revision_page.delete_draft') }}</UiButton>
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
              <UiButton v-if="isOpenRevision(revision.status) && editorPath(revision)" :to="editorPath(revision)!" size="sm">{{ $t('revision_page.continue') }}</UiButton>
              <UiButton :to="`/revisions/${revision.id}`" size="sm">{{ $t('common.details') }}</UiButton>
              <UiButton v-if="revision.status === 'pending'" variant="danger-soft" size="sm" :disabled="busy === revision.id" @click="withdraw(revision)">{{ $t('revision_page.withdraw') }}</UiButton>
            </div>
          </li>
        </ul>
      </CommonPagedList>
      <p v-if="message" class="mt-4 text-sm text-danger">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revision, RevisionStatus, RevisionAction  } from '~/types/revision'
import type { CatalogType } from '~/types/catalog'
import type { LocalDraft } from '~/utils/localDrafts'
import type { PersonalDraftMeta } from '~/utils/serverDrafts'
import { Cloud, GitPullRequest, HardDrive, Plus } from '@lucide/vue'
import { localDrafts } from '~/utils/localDrafts'
import { personalDrafts } from '~/utils/serverDrafts'
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
/** Drafts saved to CDCat (utils/serverDrafts), from any device or a model over MCP. */
const serverList = ref<PersonalDraftMeta[]>([])
const loadLocal = async () => {
  if (user.value) localList.value = await localDrafts.list(user.value.id).catch(() => [])
}
const loadServer = async () => {
  serverList.value = (await personalDrafts.list().catch(() => null))?.drafts ?? []
}
const loadDrafts = () => Promise.all([loadLocal(), loadServer()])
onMounted(loadDrafts)

/** One draft, wherever it is kept: this browser's copy, CDCat's, or both (by scope). */
interface DraftRow {
  scope: string
  label: string
  type: CatalogType
  action: RevisionAction
  entityId: number | null
  revisionId: number | null
  updatedAt: string
  local?: LocalDraft
  server?: PersonalDraftMeta
  /** CDCat has a version this browser has not loaded. */
  serverNewer: boolean
  /** Whole days until CDCat deletes its copy. */
  expiresIn: number | null
}
const draftRows = computed<DraftRow[]>(() => {
  const servers = new Map(serverList.value.map(draft => [draft.scope, draft]))
  const rows: DraftRow[] = localList.value.map((local) => {
    const server = servers.get(local.scope)
    servers.delete(local.scope)
    return {
      scope: local.scope, label: local.label || server?.label || '', type: local.type, action: local.action,
      entityId: local.entityId, revisionId: local.revisionId, local, server,
      updatedAt: server?.updated_at && server.updated_at > local.updatedAt ? server.updated_at : local.updatedAt,
      serverNewer: !!server && local.serverVersion !== server.version, expiresIn: daysLeft(server),
    }
  })
  for (const server of servers.values()) {
    rows.push({
      scope: server.scope, label: server.label, type: server.type, action: server.action, entityId: server.entity_id,
      revisionId: server.revision_id, server, updatedAt: server.updated_at ?? '', serverNewer: false, expiresIn: daysLeft(server),
    })
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
function daysLeft(server?: PersonalDraftMeta) {
  return server?.expires_at ? Math.max(0, Math.ceil((new Date(server.expires_at).getTime() - Date.now()) / 86_400_000)) : null
}

/** Deletes the draft here and on CDCat. */
const discardDraft = async (row: DraftRow) => {
  if (!confirm(t(row.server ? 'revision_page.delete_both_confirm' : 'revision_page.delete_confirm'))) return
  if (row.local) await localDrafts.remove(row.local.userId, row.scope).catch(() => undefined)
  if (row.server) await personalDrafts.remove(row.scope).catch(() => undefined)
  await loadDrafts()
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
