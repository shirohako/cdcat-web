<script setup lang="ts">
import type { AdminMergePreview, AdminPagination, AdminRestorePreview } from '~/types/admin'
import type { CatalogType, ContentVersion } from '~/types/catalog'
import type { DeletionImpact, Revision } from '~/types/revision'
import { adminContentRoutes, adminContentTypeOf, adminEditorPath, isRevisionable, mergeableContentTypes } from '~/config/admin'

definePageMeta({
  layout: 'admin', middleware: 'admin',
  validate: route => isRevisionable(adminContentTypeOf(route.params.type)) && /^\d+$/.test(String(route.params.id)),
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const type = computed(() => adminContentTypeOf(route.params.type)!)
const id = computed(() => String(route.params.id))
const paths = computed(() => adminContentRoutes[type.value])
const editor = computed(() => adminEditorPath(type.value, id.value))
const tab = computed({
  get: () => ['history', 'revisions', 'actions'].includes(String(route.query.tab)) ? String(route.query.tab) : 'history',
  set: value => { router.replace({ query: { ...route.query, tab: value === 'history' ? undefined : value } }) },
})

const { data: current, pending, error, refresh } = await useAsyncData(() => `admin-content-${type.value}-${id.value}`,
  () => $api<{ document: Record<string, unknown>, version: number }>(`/v1/${paths.value.api}/${id.value}/document`), { watch: [type, id] })
const name = computed(() => String(current.value?.document.title ?? current.value?.document.name ?? `${t(`admin_pages.types.${type.value}`)} #${id.value}`))

// ===== Versions and restore =====
const versionPage = ref(1)
const { data: versions, pending: versionsPending, error: versionsError, refresh: refreshVersions } = await useAsyncData(
  () => `admin-content-versions-${type.value}-${id.value}`,
  () => $api<{ versions: ContentVersion[], pagination: AdminPagination }>(`/v1/${paths.value.api}/${id.value}/versions`, { query: { page: versionPage.value } }),
  { watch: [versionPage, type, id], lazy: true },
)

const restore = ref<AdminRestorePreview | null>(null)
const restoreOpen = ref(false)
const previewRestore = async (version: number) => {
  message.value = ''
  restore.value = null
  try {
    restore.value = await $api<AdminRestorePreview>(`/v1/admin/content/${paths.value.api}/${id.value}/restore-preview`, { query: { version } })
  } catch (failure) {
    message.value = localizeError(failure)
  }
}
watch(() => route.query.restore, (value) => { if (value && /^\d+$/.test(String(value))) previewRestore(Number(value)) }, { immediate: true })
const confirmRestore = async (reason: string) => {
  if (busy.value || !restore.value) return
  busy.value = true
  try {
    const result = await $api<{ revision_id: number, version: number }>(`/v1/admin/content/${paths.value.api}/${id.value}/restore`, {
      method: 'POST', body: { version: restore.value.version, reason, impact_checksum: restore.value.impact?.checksum ?? null },
    })
    restoreOpen.value = false
    restore.value = null
    notice.value = t('admin_pages.content.restored', { version: result.version })
    await router.replace({ query: { ...route.query, restore: undefined } })
    await Promise.all([refresh(), refreshVersions()])
  } catch (failure) {
    message.value = localizeError(failure)
    restoreOpen.value = false
  } finally {
    busy.value = false
  }
}

// ===== Revisions that edit it =====
const { data: revisions, pending: revisionsPending, error: revisionsError, refresh: refreshRevisions } = await useAsyncData(
  () => `admin-content-revisions-${type.value}-${id.value}`,
  () => $api<{ revisions: Revision[] }>('/v1/admin/revisions', { query: { type: type.value, resource_id: id.value, per_page: 30 } }),
  { watch: [type, id], lazy: true },
)

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Recount =====
const recountable = computed(() => ['album', 'artist', 'label'].includes(type.value))
const recount = async () => {
  busy.value = true
  message.value = ''
  try {
    const result = await $api<{ results: { changed: string[] }[] }>(`/v1/admin/content/${paths.value.api}/recount`, { method: 'POST', body: { ids: [Number(id.value)] } })
    const changed = result.results[0]?.changed ?? []
    notice.value = changed.length ? t('admin_pages.content.recount_changed', { fields: changed.join('、') }) : t('admin_pages.content.recount_unchanged')
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

// ===== Delete =====
const impact = ref<DeletionImpact | null>(null)
const deleteOpen = ref(false)
const startDelete = async () => {
  message.value = ''
  try {
    impact.value = await $api<DeletionImpact>(`/v1/admin/content/${paths.value.api}/${id.value}/deletion-impact`)
    deleteOpen.value = true
  } catch (failure) {
    message.value = localizeError(failure)
  }
}
const confirmDelete = async (reason: string) => {
  if (busy.value || !impact.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/content/${paths.value.api}/${id.value}`, { method: 'DELETE', body: { reason, impact_checksum: impact.value.checksum } })
    deleteOpen.value = false
    await router.push(`/admin/content/${paths.value.api}`)
  } catch (failure) {
    message.value = localizeError(failure)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}

// ===== Merge (albums, artists, labels) =====
const mergeable = computed(() => mergeableContentTypes.includes(type.value))
const mergeKind = computed(() => type.value as 'album' | 'artist' | 'label')
const mergeTarget = ref<{ id: number, label: string } | null>(null)
const merge = ref<AdminMergePreview | null>(null)
const mergeOpen = ref(false)
/** Albums: the track mapping sent with the preview and the merge; empty means the default by position. */
const trackMap = ref<Record<string, number | null>>({})
const trackMapQuery = computed(() => Object.fromEntries(Object.entries(trackMap.value).map(([source, target]) => [`track_map[${source}]`, target ?? ''])))
const resetMerge = () => { mergeTarget.value = null; merge.value = null; trackMap.value = {} }
const changeTrackMap = (value: Record<string, number | null>) => { trackMap.value = value; previewMerge() }
// A duplicate found while reviewing opens here with the album to keep chosen (?merge_target=).
watch(() => route.query.merge_target, async (value) => {
  if (type.value !== 'album' || !value || !/^\d+$/.test(String(value)) || String(value) === id.value) return
  try {
    const target = await $api<{ document: Record<string, unknown> }>(`/v1/albums/${value}/document`)
    mergeTarget.value = { id: Number(value), label: String(target.document.title ?? `#${value}`) }
    trackMap.value = {}
    await previewMerge()
  } catch (failure) {
    message.value = localizeError(failure)
  }
}, { immediate: true })
const previewMerge = async () => {
  if (!mergeTarget.value) return
  message.value = ''
  merge.value = null
  try {
    merge.value = await $api<AdminMergePreview>(`/v1/admin/content/${paths.value.api}/${id.value}/merge-preview`, { query: { target_id: mergeTarget.value.id, ...trackMapQuery.value } })
    if (merge.value.track_map) trackMap.value = { ...merge.value.track_map }
  } catch (failure) {
    message.value = localizeError(failure)
  }
}
const confirmMerge = async (reason: string) => {
  if (busy.value || !merge.value || !mergeTarget.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/content/${paths.value.api}/${id.value}/merge`, { method: 'POST', body: { target_id: mergeTarget.value.id, reason, checksum: merge.value.checksum, ...(merge.value.track_map ? { track_map: trackMap.value } : {}) } })
    mergeOpen.value = false
    await router.push(`/admin/content/${paths.value.api}/${mergeTarget.value.id}`)
  } catch (failure) {
    message.value = localizeError(failure)
    mergeOpen.value = false
  } finally {
    busy.value = false
  }
}

const canRestore = computed(() => hasPermission('revisions.rollback'))
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const latest = computed(() => current.value?.version ?? 0)
useHead({ title: computed(() => name.value) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <NuxtLink :to="`/admin/content/${paths.api}`" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs text-slate-500">{{ t(`admin_pages.types.${type}`) }} #{{ id }} · {{ t('admin_pages.content.current_version', { version: latest }) }}</p>
          <h1 class="mt-1 text-2xl font-bold">{{ name }}</h1>
        </div>
        <div class="flex flex-wrap gap-3 text-sm">
          <NuxtLink v-if="editor" :to="editor" class="rounded-lg bg-slate-900 px-3 py-1.5 text-white">{{ t('admin_pages.content.open_editor') }}</NuxtLink>
          <NuxtLink v-if="hasPermission('audit.view')" :to="{ path: '/admin/audit', query: { target_type: type, target_id: id } }" class="underline">{{ t('admin_pages.audit.title') }}</NuxtLink>
          <NuxtLink :to="type === 'lyric' ? `/lyrics/${id}/versions` : `/${paths.front}/${id}`" target="_blank" class="underline">{{ t('admin_pages.preview_front') }}</NuxtLink>
        </div>
      </header>
    </AdminListState>

    <nav class="flex gap-2 border-b border-slate-200 text-sm">
      <button v-for="item in ['history', 'revisions', 'actions']" :key="item" type="button" :aria-pressed="tab === item" class="-mb-px border-b-2 px-3 py-2" :class="tab === item ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'" @click="tab = item">{{ t(`admin_pages.content.tab_${item}`) }}</button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <template v-if="tab === 'history'">
      <section v-if="restore" class="rounded-xl border border-amber-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold">{{ t('admin_pages.content.restore_title', { version: restore.version, current: restore.current_version }) }}</h2>
          <button type="button" class="text-sm text-slate-500" @click="restore = null">{{ t('common.close') }}</button>
        </div>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.restore_help') }}</p>
        <ul v-if="restore.problems.length" role="alert" class="mt-3 list-inside list-disc text-sm text-red-700">
          <li v-for="problem in restore.problems" :key="problem.path"><span class="font-mono text-xs">{{ problem.path }}</span> {{ problem.message }}</li>
        </ul>
        <AdminImpactPreview v-if="restore.impact" :impact="restore.impact" />
        <div class="mt-4">
          <p v-if="!restore.changes.length" class="text-sm text-slate-500">{{ t('admin_pages.no_changes') }}</p>
          <CatalogDiffView v-else :type="type as CatalogType" :changes="restore.changes" :references="restore.references" />
        </div>
        <button v-if="canRestore" type="button" :disabled="busy || !!restore.problems.length || !restore.changes.length || !!restore.impact?.blockers.length" class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40" @click="restoreOpen = true">{{ t('admin_pages.content.restore_confirm') }}</button>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white">
        <AdminListState :pending="versionsPending" :error="versionsError" :empty="!versions?.versions.length" @retry="refreshVersions()">
          <ol class="divide-y divide-slate-100">
            <li v-for="version in versions?.versions" :key="version.version" class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div class="min-w-0">
                <p class="font-medium">
                  {{ t('admin_pages.content.version', { version: version.version }) }}
                  <span class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ t(`admin_pages.content.causes.${version.cause}`) }}</span>
                  <span v-if="version.is_deleted" class="ml-1 text-xs text-red-700">{{ t('admin_pages.content.deleted_version') }}</span>
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ version.actor?.nickname || version.actor?.username || t('admin_pages.content.system') }} · {{ time(version.created_at) }}
                  <template v-if="version.revision_id"> · <NuxtLink :to="`/admin/revisions/${version.revision_id}`" class="underline">#{{ version.revision_id }}</NuxtLink></template>
                  <template v-if="version.reason"> · {{ version.reason }}</template>
                </p>
              </div>
              <div class="flex gap-3 text-xs">
                <NuxtLink :to="`/${paths.api}/${id}/versions?version=${version.version}`" target="_blank" class="underline">{{ t('admin_pages.content.view_version') }}</NuxtLink>
                <button v-if="canRestore && version.version !== latest && !version.is_deleted" type="button" class="underline" @click="previewRestore(version.version)">{{ t('admin_pages.content.restore_preview') }}</button>
              </div>
            </li>
          </ol>
          <footer v-if="versions" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="versionPage" :total-pages="versions.pagination.last_page" :disabled="versionsPending" /></footer>
        </AdminListState>
      </section>
    </template>

    <section v-else-if="tab === 'revisions'" class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="revisionsPending" :error="revisionsError" :empty="!revisions?.revisions.length" @retry="refreshRevisions()">
        <ol class="divide-y divide-slate-100">
          <li v-for="revision in revisions?.revisions" :key="revision.id" class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <div class="min-w-0">
              <NuxtLink :to="`/admin/revisions/${revision.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">#{{ revision.id }} · {{ revision.summary || revision.title }}</NuxtLink>
              <p class="mt-1 text-xs text-slate-500">{{ revision.submitter?.nickname || revision.submitter?.username }} · {{ time(revision.submitted_at ?? revision.created_at) }}</p>
            </div>
            <RevisionStatusBadge :status="revision.status" />
          </li>
        </ol>
      </AdminListState>
    </section>

    <div v-else class="grid gap-5 lg:grid-cols-2">
      <section v-if="recountable" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">{{ t('admin_pages.content.recount') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.recount_help') }}</p>
        <button type="button" :disabled="busy" class="mt-4 rounded-lg border px-4 py-2 text-sm disabled:opacity-40" @click="recount">{{ t('admin_pages.content.recount') }}</button>
      </section>
      <section v-if="mergeable" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">{{ t('admin_pages.content.merge_title', { type: t(`admin_pages.types.${type}`) }) }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t(type === 'album' ? 'admin_pages.content.merge_help_album' : 'admin_pages.content.merge_help') }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span v-if="mergeTarget" class="rounded-lg bg-slate-100 px-3 py-2 text-sm">{{ mergeTarget.label }} #{{ mergeTarget.id }} <button type="button" class="ml-1 text-slate-500" @click="resetMerge">×</button></span>
          <EditorEntityPicker v-else :kind="mergeKind" :exclude="[Number(id)]" exclude-pending class="min-w-64" :placeholder="t('admin_pages.content.merge_target')" @select="mergeTarget = { id: Number($event.id), label: $event.label }; trackMap = {}" />
          <button type="button" :disabled="!mergeTarget" class="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" @click="previewMerge">{{ t('admin_pages.content.merge_preview') }}</button>
        </div>
        <div v-if="merge && mergeTarget" class="mt-4 text-sm">
          <p>{{ t('admin_pages.content.merge_summary', { source: name, target: mergeTarget.label, id: mergeTarget.id }) }}</p>
          <dl class="mt-2 space-y-1">
            <div v-for="(count, key) in merge.affected" :key="`a-${key}`" class="flex justify-between gap-4"><dt>{{ t('admin_pages.content.merge_affected', { type: t(`admin_pages.types.${key}`) }) }}</dt><dd>{{ count }}</dd></div>
            <div v-for="(count, key) in (merge.moves ? {} : merge.external)" :key="`e-${key}`" class="flex justify-between gap-4"><dt class="text-slate-500">{{ key }}</dt><dd>{{ count }}</dd></div>
          </dl>
          <dl v-if="merge.absorb && Object.keys(merge.absorb).length" class="mt-3 grid max-w-md gap-1">
            <div v-for="(count, key) in merge.absorb" :key="`b-${key}`" class="flex justify-between gap-4"><dt>{{ t(`admin_pages.content.merge_absorb_${key}`) }}</dt><dd>{{ count }}</dd></div>
          </dl>
          <dl v-if="merge.moves && Object.values(merge.moves).some(Boolean)" class="mt-3 grid max-w-md gap-1">
            <dt class="font-medium">{{ t('admin_pages.content.merge_moves') }}</dt>
            <div v-for="(count, key) in merge.moves" v-show="count" :key="`m-${key}`" class="flex justify-between gap-4">
              <dt class="text-slate-500">{{ key }}</dt><dd>{{ count }}<span v-if="merge.dropped?.[key]" class="ml-1 text-amber-700">{{ t('admin_pages.content.merge_dropped', { count: merge.dropped[key] }) }}</span></dd>
            </div>
          </dl>
          <ul v-if="merge.warnings?.length" class="mt-3 list-inside list-disc text-amber-800"><li v-for="warning in merge.warnings" :key="warning">{{ warning }}</li></ul>
          <div v-if="merge.source_tracks?.length" class="mt-4">
            <h3 class="font-medium">{{ t('admin_pages.content.merge_tracks') }}</h3>
            <p class="mt-0.5 text-xs text-slate-500">{{ t('admin_pages.content.merge_tracks_help') }}</p>
            <AdminMergeTrackMap class="mt-2" :source-tracks="merge.source_tracks" :target-tracks="merge.target_tracks ?? []" :model-value="trackMap" :disabled="busy" @update:model-value="changeTrackMap" />
          </div>
          <ul v-if="merge.blockers.length" role="alert" class="mt-3 list-inside list-disc text-red-700"><li v-for="blocker in merge.blockers" :key="blocker">{{ blocker }}</li></ul>
          <button type="button" :disabled="Boolean(merge.blockers.length)" class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" @click="mergeOpen = true">{{ t('admin_pages.content.merge_confirm') }}</button>
        </div>
      </section>
      <section class="rounded-xl border border-red-200 bg-white p-5">
        <h2 class="font-semibold text-red-800">{{ t('admin_pages.content.delete') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.delete_help') }}</p>
        <button type="button" class="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700" @click="startDelete">{{ t('admin_pages.content.delete_preview') }}</button>
      </section>
    </div>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :confirm-phrase="`#${id}`" :confirm-disabled="Boolean(impact?.blockers.length)" :title="t('admin_pages.content.delete_title', { name })" :description="t('admin_pages.content.delete_help')" @confirm="confirmDelete">
      <AdminImpactPreview v-if="impact" :impact="impact" />
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="mergeOpen" :busy="busy" reason-required :confirm-phrase="mergeTarget ? `#${mergeTarget.id}` : ''" :title="t('admin_pages.content.merge_confirm')" :description="merge && mergeTarget ? t('admin_pages.content.merge_summary', { source: name, target: mergeTarget.label, id: mergeTarget.id }) : ''" @confirm="confirmMerge" />
    <AdminConfirmDialog v-model="restoreOpen" :busy="busy" reason-required :title="t('admin_pages.content.restore_confirm')" :description="t('admin_pages.content.restore_dialog')" @confirm="confirmRestore" />
  </div>
</template>
