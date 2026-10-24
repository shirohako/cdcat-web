<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <NuxtLink to="/revisions" class="mb-4 inline-flex items-center gap-1 text-sm text-meta transition-colors hover:text-primary"><ArrowLeft :size="14" />{{ $t('revision_page.back') }}</NuxtLink>

      <div v-if="revision" :class="revealClass">
        <header class="mb-5 flex flex-wrap items-start gap-3">
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-bold text-title">{{ heading }}</h1>
            <p v-if="revision.summary" class="mt-1 whitespace-pre-line text-body">{{ revision.summary }}</p>
            <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-meta">
              <span>#{{ revision.id }}</span>
              <span v-if="revision.kind === 'lyric'">{{ $t('revision_page.kind.lyric') }}</span>
              <span v-if="revision.origin !== 'manual'">{{ $t(`revision_page.origin.${revision.origin}`) }}</span>
              <span v-if="revision.submitter">{{ $t('revision_page.by', { name: revision.submitter.nickname || revision.submitter.username }) }}</span>
              <span :title="exact(revision.updated_at)">{{ $t('revision_page.updated', { at: ago(revision.updated_at) }) }}</span>
              <span v-if="revision.requires_content_manage && revision.status === 'pending'" class="text-warning">{{ $t('revision_page.requires_manage') }}</span>
            </p>
          </div>
          <RevisionStatusBadge :status="revision.status" />
        </header>

        <div v-if="mine" class="mb-5 flex flex-wrap gap-2">
          <NuxtLink v-if="isOpenRevision(revision.status) && editor" :to="editor" class="btn btn-primary btn-sm">{{ $t('revision_page.continue') }}</NuxtLink>
          <!-- With edits kept in this browser, resubmitting here would send the revision without them. -->
          <button v-if="revision.status === 'changes_requested' && !localEditsAt" type="button" class="btn btn-sm" :disabled="busy" @click="submit">{{ $t('revision_page.resubmit') }}</button>
          <button v-if="revision.status === 'pending' || revision.status === 'changes_requested'" type="button" class="btn btn-ghost btn-sm text-danger" :disabled="busy" @click="withdraw">{{ $t('revision_page.withdraw') }}</button>
        </div>
        <p v-if="mine && localEditsAt && isOpenRevision(revision.status)" class="mb-5 rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-info">
          {{ $t('revision_page.local_edits', { at: ago(localEditsAt) }) }}
        </p>
        <p v-if="message" class="mb-4 text-sm text-danger">{{ message }}</p>

        <!-- New content this revision put live; it waits for this review (docs/catalog/editing.md#待审内容). -->
        <div v-if="liveContent.length" class="mb-5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-body">
          <p class="font-semibold text-warning">{{ $t('revision_page.live_content') }}</p>
          <ul class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            <li v-for="entry in liveContent" :key="`${entry.type}:${entry.id}`">
              <span class="text-xs text-meta">{{ enumLabel('catalog_type', entry.type) }}</span>
              <NuxtLink v-if="entityPath(entry.type, entry.id)" :to="entityPath(entry.type, entry.id)!" class="link link-muted ml-1">{{ entry.label }}</NuxtLink>
              <span v-else class="ml-1">{{ entry.label }}</span>
            </li>
          </ul>
        </div>

        <div v-if="revision.review_comment" class="mb-5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-body">
          <p class="font-semibold text-warning">{{ $t('revision_page.review_comment') }}<span v-if="revision.reviewer" class="font-normal"> · {{ revision.reviewer.nickname || revision.reviewer.username }}</span></p>
          <p class="mt-1 whitespace-pre-line">{{ revision.review_comment }}</p>
        </div>

        <div v-if="mine && conflictsByItem.length && !localEditsAt" class="mb-5 space-y-3">
          <EditorConflictResolver
            v-for="group in conflictsByItem"
            :key="group.ref"
            :rebase="rebaseItem"
            :conflicts="group.conflicts"
            :type="group.type"
            @resolved="refresh()"
          />
        </div>
        <div v-if="problems.length" class="mb-5 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          <p class="font-semibold">{{ $t('revision_page.errors') }}</p>
          <ul class="mt-1 list-inside list-disc space-y-0.5">
            <li v-for="problem in problems" :key="problem.path"><span class="font-mono text-xs opacity-70">{{ problem.path }}</span> {{ problem.message }}</li>
          </ul>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div class="min-w-0 space-y-3">
            <h2 class="text-sm font-bold uppercase tracking-wider text-meta">{{ $t('revision_page.items') }}</h2>
            <RevisionItems :items="revision.items ?? []" :references="revision.references ?? {}" :approved="revision.status === 'approved'" />
          </div>
          <aside class="space-y-5">
            <div v-if="revision.sources.length">
              <h2 class="mb-2 text-sm font-bold uppercase tracking-wider text-meta">{{ $t('revision_page.sources') }}</h2>
              <ul class="space-y-1 text-sm">
                <li v-for="source in revision.sources" :key="source" class="break-all">
                  <a v-if="/^https?:\/\//.test(source)" :href="source" target="_blank" rel="noopener nofollow" class="link">{{ source }}</a>
                  <span v-else class="text-body">{{ source }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-meta">{{ $t('revision_page.timeline') }}</h2>
              <RevisionTimeline :events="revision.events ?? []" />
            </div>
          </aside>
        </div>
      </div>
      <p v-else-if="status === 'error'" class="alert alert-error">{{ localizeError(error) }}</p>
      <SkeletonRevision v-else />
    </div>

    <CommonConfirmDialog
      v-model="withdrawOpen"
      wide
      :title="$t('revision_page.withdraw_live_title')"
      :description="$t('revision_page.withdraw_live_desc')"
      :confirm-text="$t('revision_page.withdraw')"
      :confirm-phrase="`#${route.params.id}`"
      @confirm="confirmWithdraw"
    >
      <RevisionRemovalPlan v-if="removal" class="mt-4 max-h-72 overflow-y-auto" :plan="removal" />
    </CommonConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { RemovalPlan, Revision } from '~/types/revision'
import { ArrowLeft } from '@lucide/vue'
import { errorName, revisionFieldErrors } from '~/utils/revisionErrors'
import { localDrafts } from '~/utils/localDrafts'
import { editorPath, entityPath, isOpenRevision } from '~/utils/revisionLinks'

const route = useRoute()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { user } = useAuth()
const { ago, exact } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()

// Fetched fresh and only in the browser; server and browser both start out with the skeleton.
const { data: revision, status, error, refresh, revealClass } = await usePageData(`revision:${route.params.id}`,
  ({ signal }) => $api<Revision>(`/v1/revisions/${route.params.id}`, { signal }), { cache: false, server: false })

const mine = computed(() => !!revision.value && revision.value.submitter?.id === user.value?.id)
const editor = computed(() => revision.value ? editorPath(revision.value) : null)
const heading = computed(() => {
  const match = revision.value?.title?.match(/^([a-z]+): (.*)$/)
  return match ? `${enumLabel('catalog_type', match[1]!)} · ${match[2]}` : (revision.value?.title || `#${route.params.id}`)
})

/** Conflicts with the current content, from the merge preview of an open revision. */
const conflictsByItem = computed(() => (revision.value?.preview ?? []).filter(item => item.conflicts.length).map((item) => {
  const type = revision.value?.items?.find(entry => entry.ref === item.ref)?.resource_type ?? 'album'
  return { ref: item.ref, type: type as CatalogType, conflicts: item.conflicts.map(conflict => ({ ...conflict, ref: item.ref })) }
}))
const submitErrors = ref<Array<{ path: string, message: string }>>([])
const problems = computed(() => [
  ...(revision.value?.preview ?? []).flatMap(item => Object.entries(item.errors ?? {}).map(([path, message]) => ({ path, message: String(message) }))),
  ...submitErrors.value,
])

const busy = ref(false)
const message = ref('')
const run = async (request: () => Promise<unknown>) => {
  busy.value = true
  message.value = ''
  submitErrors.value = []
  try {
    await request()
    await refresh()
  } catch (failure) {
    if (errorName(failure) === 'VALIDATION_FAILED') submitErrors.value = revisionFieldErrors(failure)
    else message.value = localizeError(failure)
    // The merge preview now shows the conflicts to resolve.
    if (errorName(failure) === 'REVISION_CONFLICT') await refresh()
  } finally {
    busy.value = false
  }
}
const liveContent = computed(() => Object.entries(revision.value?.pending_content ?? {})
  .flatMap(([type, rows]) => (rows ?? []).map(row => ({ type: type as CatalogType, ...row }))))

const submit = () => run(() => $api(`/v1/revisions/${route.params.id}/submit`, { method: 'POST' }))
const rebaseItem = (ref: string, resolutions: Record<string, 'mine' | 'current'>) =>
  $api(`/v1/revisions/${route.params.id}/items/${ref}/rebase`, { method: 'POST', body: { resolutions } })

/** When the submitter's edits of this revision are kept in this browser, they are resubmitted from the editor. */
const localEditsAt = ref<string | null>(null)
onMounted(async () => {
  if (!user.value) return
  localEditsAt.value = (await localDrafts.get(user.value.id, `revision:${route.params.id}`).catch(() => undefined))?.updatedAt ?? null
})

// Withdrawing a revision whose content is live removes that content: confirm its plan first.
const withdrawOpen = ref(false)
const removal = ref<RemovalPlan | null>(null)
const withdraw = async () => {
  if (!revision.value?.has_applied_items) {
    if (confirm(t('revision_page.withdraw_confirm'))) await run(() => $api(`/v1/revisions/${route.params.id}/withdraw`, { method: 'POST' }))
    return
  }
  message.value = ''
  try {
    removal.value = (await $api<{ removal: RemovalPlan | null }>(`/v1/revisions/${route.params.id}/pending-content`)).removal
    withdrawOpen.value = true
  } catch (failure) {
    message.value = localizeError(failure)
  }
}
const confirmWithdraw = () => run(() => $api(`/v1/revisions/${route.params.id}/withdraw`, { method: 'POST', body: { impact_checksum: removal.value?.checksum } }))

useSeoMeta({ title: () => heading.value, robots: 'noindex' })
</script>
