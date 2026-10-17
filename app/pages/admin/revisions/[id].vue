<script setup lang="ts">
import { adminContentRoutes } from '~/config/admin'
import type { AdminContentType, AdminRevision, AdminRollbackPreview, DeletionImpact } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const id = computed(() => Number(route.params.id))
const { data, pending, error, refresh } = await useAsyncData(() => `admin-revision-${id.value}`,
  () => $api<{ revision: AdminRevision, previous: { data: Record<string, unknown> } | null }>(`/v1/revisions/${id.value}`), { watch: [id] })
const revision = computed(() => data.value?.revision)
const before = computed(() => revision.value?.action === 'delete' ? (revision.value.data ?? {}) : (data.value?.previous?.data ?? {}))
const after = computed(() => revision.value?.action === 'delete' ? {} : (revision.value?.after_snapshot ?? revision.value?.data ?? {}))
const view = ref<'diff' | 'raw'>('diff')
const routes = computed(() => revision.value ? adminContentRoutes[revision.value.resource_type as AdminContentType] : undefined)
const entityLink = computed(() => revision.value?.resource_id && routes.value && revision.value.action !== 'delete' && hasPermission('content.manage')
  ? `/admin/content/${routes.value.api}/${revision.value.resource_id}` : null)
const frontLink = computed(() => revision.value?.resource_id && routes.value && revision.value.action !== 'delete' ? `/${routes.value.front}/${revision.value.resource_id}` : null)

// ===== Review =====
const canReview = computed(() => hasPermission('revisions.review') && revision.value?.status === 'pending')
const needsContentManage = computed(() => Boolean(revision.value?.requires_content_manage) && !hasPermission('content.manage'))
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')
const deletionImpact = ref<DeletionImpact | null>(null)
const removedTrackIds = computed(() => {
  const ids = (list: unknown) => Array.isArray(list) ? list.map(item => Number((item as { id?: number }).id)).filter(Boolean) : []
  const kept = new Set(ids(after.value.related_tracks))
  return revision.value?.action === 'update' ? ids(before.value.related_tracks).filter(trackId => !kept.has(trackId)) : []
})
const openReview = async (action: 'approve' | 'reject') => {
  reviewAction.value = action
  message.value = ''
  deletionImpact.value = null
  const current = revision.value
  if (action === 'approve' && current?.requires_content_manage && current.resource_id) {
    try {
      deletionImpact.value = await $api<DeletionImpact>(`/v1/admin/content/${adminContentRoutes[current.resource_type as AdminContentType].api}/${current.resource_id}/deletion-impact`,
        { query: current.action === 'delete' ? {} : { 'track_ids[]': removedTrackIds.value } })
    } catch (e) {
      message.value = localizeError(e)
      return
    }
  }
  reviewOpen.value = true
}
const confirmReview = async (reason: string) => {
  if (busy.value || !revision.value) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/revisions/${revision.value.id}/${reviewAction.value}`, { method: 'POST', body: { review_comment: reason || null } })
    reviewOpen.value = false
    notice.value = t(reviewAction.value === 'approve' ? 'admin_pages.revisions.approved_notice' : 'admin_pages.revisions.rejected_notice')
    await refresh()
  } catch (e) {
    message.value = localizeError(e, 'admin_pages.revisions.action_failed')
  } finally {
    busy.value = false
  }
}

// ===== Rollback =====
const canRollback = computed(() => hasPermission('revisions.rollback') && revision.value?.status === 'approved'
  && revision.value.action !== 'delete' && !revision.value.requires_reconfirmation)
const rollback = ref<AdminRollbackPreview | null>(null)
const rollbackError = ref('')
const rollbackOpen = ref(false)
const previewRollback = async () => {
  rollbackError.value = ''
  rollback.value = null
  try {
    rollback.value = await $api<AdminRollbackPreview>(`/v1/admin/revisions/${id.value}/rollback-preview`)
  } catch (e) {
    const details = (e as { details?: { name?: string, details?: { missing_references?: { field: string, id: number }[] } } }).details
    const missing = details?.details?.missing_references
    rollbackError.value = missing?.length
      ? t('admin_pages.revisions.rollback_missing', { refs: missing.map(item => `${item.field} #${item.id}`).join('、') })
      : localizeError(e)
  }
}
const confirmRollback = async (reason: string) => {
  if (busy.value || !rollback.value) return
  busy.value = true
  rollbackError.value = ''
  try {
    const result = await $api<{ revision: AdminRevision }>(`/v1/admin/revisions/${id.value}/rollback`, { method: 'POST', body: {
      reason, baseline_checksum: rollback.value.baseline_checksum, impact_checksum: rollback.value.impact?.checksum ?? null,
    } })
    rollbackOpen.value = false
    await router.push(`/admin/revisions/${result.revision.id}`)
  } catch (e) {
    rollbackError.value = localizeError(e)
    rollbackOpen.value = false
  } finally {
    busy.value = false
  }
}

const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const typeLabel = (type: string) => ['album', 'artist', 'entry', 'franchise'].includes(type) ? t(`admin_pages.types.${type}`) : type
useHead({ title: computed(() => revision.value?.title ?? t('admin_pages.revisions.detail')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/revisions" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="revision">
        <header class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-xs text-slate-500">{{ typeLabel(revision.resource_type) }}<template v-if="revision.resource_id"> #{{ revision.resource_id }}</template> · {{ t('admin_pages.revisions.revision_number', { number: revision.revision_number }) }} · #{{ revision.id }}</p>
          <h1 class="mt-2 text-2xl font-bold">{{ revision.title }}</h1>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="rounded border px-2 py-0.5">{{ t(`admin_pages.revisions.action_${revision.action}`) }}</span>
            <span class="rounded border px-2 py-0.5">{{ t(`admin_pages.revisions.status_${revision.status}`) }}</span>
            <span v-if="revision.is_auto_approved" class="rounded border px-2 py-0.5">{{ t('admin_pages.revisions.auto_yes') }}</span>
            <NuxtLink v-if="revision.rollback_of_id" :to="`/admin/revisions/${revision.rollback_of_id}`" class="rounded border border-violet-200 px-2 py-0.5 text-violet-700">{{ t('admin_pages.revisions.rollback_of', { id: revision.rollback_of_id }) }}</NuxtLink>
          </div>
          <dl class="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt class="text-xs text-slate-500">{{ t('admin_pages.revisions.submitter') }}</dt><dd>{{ revision.submitter?.nickname || revision.submitter?.username || '—' }}</dd></div>
            <div><dt class="text-xs text-slate-500">{{ t('admin_pages.revisions.submitted_at') }}</dt><dd>{{ time(revision.created_at) }}</dd></div>
            <div><dt class="text-xs text-slate-500">{{ t('admin_pages.revisions.reviewer') }}</dt><dd>{{ revision.reviewer?.nickname || revision.reviewer?.username || '—' }}</dd></div>
            <div><dt class="text-xs text-slate-500">{{ t('admin_pages.revisions.reviewed_at') }}</dt><dd>{{ time(revision.reviewed_at) }}</dd></div>
          </dl>
          <p v-if="revision.comment" class="mt-4 whitespace-pre-wrap text-sm"><span class="text-slate-500">{{ t('admin_pages.revisions.comment') }}：</span>{{ revision.comment }}</p>
          <p v-if="revision.review_comment" class="mt-2 whitespace-pre-wrap text-sm"><span class="text-slate-500">{{ t('admin_pages.revisions.review_comment') }}：</span>{{ revision.review_comment }}</p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm">
            <NuxtLink v-if="entityLink" :to="entityLink" class="underline">{{ t('admin_pages.revisions.open_entity') }}</NuxtLink>
            <NuxtLink v-if="frontLink" :to="frontLink" target="_blank" class="underline">{{ t('admin_pages.preview_front') }}</NuxtLink>
          </div>
        </header>

        <div v-if="revision.requires_reconfirmation" role="alert" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{{ t('admin_pages.revisions.baseline_insufficient') }}</div>
        <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <div v-if="canReview" class="flex flex-wrap items-center gap-3">
          <button type="button" :disabled="busy || revision.requires_reconfirmation || needsContentManage" class="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm text-emerald-700 disabled:opacity-40" @click="openReview('approve')">{{ t('admin_pages.revisions.approve') }}</button>
          <button type="button" :disabled="busy" class="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 disabled:opacity-40" @click="openReview('reject')">{{ t('admin_pages.revisions.reject') }}</button>
          <span v-if="needsContentManage" class="text-xs text-slate-500">{{ t('admin_pages.revisions.needs_content_manage') }}</span>
        </div>

        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-semibold">{{ t('admin_pages.revisions.changes') }}</h2>
            <div class="flex gap-1 text-xs">
              <button v-for="mode in (['diff', 'raw'] as const)" :key="mode" type="button" :aria-pressed="view === mode" class="rounded-md px-3 py-1" :class="view === mode ? 'bg-slate-900 text-white' : 'border'" @click="view = mode">{{ t(`admin_pages.revisions.view_${mode}`) }}</button>
            </div>
          </div>
          <p v-if="!data?.previous && revision.action === 'update'" class="mb-3 text-sm text-amber-700">{{ t('admin_pages.revisions.no_previous') }}</p>
          <AdminJsonDiff v-if="view === 'diff'" :before="before" :after="after" />
          <div v-else class="grid gap-3 lg:grid-cols-2">
            <div><h3 class="mb-2 text-xs text-slate-500">{{ t('admin_pages.before') }}</h3><pre class="max-h-150 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{{ JSON.stringify(before, null, 2) }}</pre></div>
            <div><h3 class="mb-2 text-xs text-slate-500">{{ t('admin_pages.after') }}</h3><pre class="max-h-150 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{{ JSON.stringify(after, null, 2) }}</pre></div>
          </div>
        </section>

        <section v-if="canRollback" class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ t('admin_pages.revisions.rollback') }}</h2>
              <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.revisions.rollback_help') }}</p>
            </div>
            <button type="button" class="rounded-lg border px-4 py-2 text-sm" @click="previewRollback">{{ t('admin_pages.revisions.rollback_preview') }}</button>
          </div>
          <p v-if="rollbackError" role="alert" class="mt-3 text-sm text-red-700">{{ rollbackError }}</p>
          <template v-if="rollback">
            <h3 class="mt-4 text-sm text-slate-600">{{ t('admin_pages.revisions.rollback_diff') }}</h3>
            <div class="mt-2"><AdminJsonDiff :before="rollback.current" :after="rollback.target" /></div>
            <AdminImpactPreview v-if="rollback.impact" :impact="rollback.impact" />
            <button type="button" :disabled="Boolean(rollback.impact?.blockers.length)" class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40" @click="rollbackOpen = true">{{ t('admin_pages.revisions.rollback_confirm') }}</button>
          </template>
        </section>
      </template>
    </AdminListState>

    <AdminConfirmDialog
v-model="reviewOpen" :busy="busy" :reason-required="reviewAction === 'reject' || Boolean(deletionImpact)"
      :confirm-disabled="Boolean(deletionImpact?.blockers.length)"
      :title="t(reviewAction === 'approve' ? 'admin_pages.revisions.approve_title' : 'admin_pages.revisions.reject_title')"
      :description="t(reviewAction === 'approve' ? 'admin_pages.revisions.approve_confirm' : 'admin_pages.revisions.reject_confirm', { title: revision?.title ?? '' })" @confirm="confirmReview">
      <AdminImpactPreview v-if="deletionImpact" :impact="deletionImpact" />
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="rollbackOpen" :busy="busy" reason-required :title="t('admin_pages.revisions.rollback')" :description="t('admin_pages.revisions.rollback_dialog')" @confirm="confirmRollback" />
  </div>
</template>
