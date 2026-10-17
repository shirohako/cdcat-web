<script setup lang="ts">
import { adminContentRoutes, adminContentTypeOf, isRevisionable } from '~/config/admin'
import type { AdminMergePreview, AdminPagination, AdminRevision, DeletionImpact } from '~/types/admin'

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
const tab = computed({
  get: () => ['edit', 'history', 'actions'].includes(String(route.query.tab)) ? String(route.query.tab) : 'edit',
  set: value => { router.replace({ query: { ...route.query, tab: value === 'edit' ? undefined : value } }) },
})
const toRevision = (revisionId: number) => `/admin/revisions/${revisionId}`

const { data: schema, pending, error, refresh } = await useAsyncData(() => `admin-content-schema-${type.value}-${id.value}`,
  () => $api<Record<string, unknown>>(`/v1/${paths.value.api}/${id.value}/schema`), { watch: [type, id] })
const name = computed(() => String(schema.value?.title ?? schema.value?.name ?? `#${id.value}`))

const historyPage = ref(1)
const { data: history, pending: historyPending, error: historyError, refresh: refreshHistory } = await useAsyncData(
  () => `admin-content-history-${type.value}-${id.value}`,
  () => $api<{ revisions: AdminRevision[], pagination: AdminPagination }>(`/v1/${paths.value.api}/${id.value}/revisions`, { query: { page: historyPage.value } }),
  { watch: [historyPage, type, id], lazy: true },
)

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Recount =====
const recountable = computed(() => ['album', 'artist'].includes(type.value))
const recount = async () => {
  busy.value = true
  message.value = ''
  try {
    const result = await $api<{ results: { changed: string[] }[] }>(`/v1/admin/content/${paths.value.api}/recount`, { method: 'POST', body: { ids: [Number(id.value)] } })
    const changed = result.results[0]?.changed ?? []
    notice.value = changed.length ? t('admin_pages.content.recount_changed', { fields: changed.join('、') }) : t('admin_pages.content.recount_unchanged')
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

// ===== Delete =====
const impact = ref<DeletionImpact & { baseline_checksum?: string } | null>(null)
const deleteOpen = ref(false)
const startDelete = async () => {
  message.value = ''
  try {
    impact.value = await $api<DeletionImpact & { baseline_checksum?: string }>(`/v1/admin/content/${paths.value.api}/${id.value}/deletion-impact`)
    deleteOpen.value = true
  } catch (e) {
    message.value = localizeError(e)
  }
}
const confirmDelete = async (reason: string) => {
  if (busy.value || !impact.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/content/${paths.value.api}/${id.value}`, { method: 'DELETE', body: { reason, impact_checksum: impact.value.checksum, baseline_checksum: impact.value.baseline_checksum } })
    deleteOpen.value = false
    await router.push(`/admin/content/${paths.value.api}`)
  } catch (e) {
    message.value = localizeError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}

// ===== Merge (artists) =====
const mergeTarget = ref('')
const merge = ref<AdminMergePreview | null>(null)
const mergeOpen = ref(false)
const previewMerge = async () => {
  message.value = ''
  merge.value = null
  try {
    merge.value = await $api<AdminMergePreview>(`/v1/admin/content/artists/${id.value}/merge-preview`, { query: { target_id: mergeTarget.value } })
  } catch (e) {
    message.value = localizeError(e)
  }
}
const confirmMerge = async (reason: string) => {
  if (busy.value || !merge.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/content/artists/${id.value}/merge`, { method: 'POST', body: { target_id: merge.value.target.id, reason, checksum: merge.value.checksum } })
    mergeOpen.value = false
    await router.push(`/admin/content/artists/${merge.value.target.id}`)
  } catch (e) {
    message.value = localizeError(e)
    mergeOpen.value = false
  } finally {
    busy.value = false
  }
}

const statusClass: Record<string, string> = { pending: 'text-amber-700', approved: 'text-emerald-700', rejected: 'text-slate-500' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => name.value) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <NuxtLink :to="`/admin/content/${paths.api}`" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs text-slate-500">{{ t(`admin_pages.types.${type}`) }} #{{ id }}</p>
        <h1 class="mt-1 text-2xl font-bold">{{ name }}</h1>
      </div>
      <div class="flex gap-4 text-sm">
        <NuxtLink v-if="hasPermission('audit.view')" :to="{ path: '/admin/audit', query: { target_type: type, target_id: id } }" class="underline">{{ t('admin_pages.audit.title') }}</NuxtLink>
        <NuxtLink :to="`/${paths.front}/${id}`" target="_blank" class="underline">{{ t('admin_pages.preview_front') }}</NuxtLink>
      </div>
    </header>
    <nav class="flex gap-2 border-b border-slate-200 text-sm">
      <button v-for="item in ['edit', 'history', 'actions']" :key="item" type="button" :aria-pressed="tab === item" class="-mb-px border-b-2 px-3 py-2" :class="tab === item ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'" @click="tab = item">{{ t(`admin_pages.content.tab_${item}`) }}</button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <AdminListState v-if="tab === 'edit'" :pending="pending" :error="error" @retry="refresh()">
      <div v-if="schema" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <p class="mb-4 text-sm text-slate-500">{{ t('admin_pages.content.edit_help') }}</p>
        <RevisionAlbumForm v-if="type === 'album'" :initial-data="schema" :album-id="id" :redirect-to="toRevision" />
        <RevisionArtistForm v-else-if="type === 'artist'" :initial-data="schema" :artist-id="id" :redirect-to="toRevision" />
        <RevisionEntryForm v-else-if="type === 'entry'" :initial-data="schema" :entry-id="id" :redirect-to="toRevision" />
        <RevisionFranchiseForm v-else-if="type === 'franchise'" :initial-data="schema" :franchise-id="id" :redirect-to="toRevision" />
      </div>
    </AdminListState>

    <section v-else-if="tab === 'history'" class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="historyPending" :error="historyError" :empty="!history?.revisions.length" @retry="refreshHistory()">
        <ol class="divide-y divide-slate-100">
          <li v-for="revision in history?.revisions" :key="revision.id" class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <div class="min-w-0">
              <NuxtLink :to="`/admin/revisions/${revision.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ t('admin_pages.revisions.revision_number', { number: revision.revision_number }) }} · {{ revision.title }}</NuxtLink>
              <p class="mt-1 text-xs text-slate-500">{{ revision.submitter?.nickname || revision.submitter?.username }} · {{ time(revision.created_at) }}<template v-if="revision.rollback_of_id"> · {{ t('admin_pages.revisions.rollback_of', { id: revision.rollback_of_id }) }}</template></p>
            </div>
            <span class="text-xs" :class="statusClass[revision.status]">{{ t(`admin_pages.revisions.status_${revision.status}`) }}</span>
          </li>
        </ol>
        <footer v-if="history" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="historyPage" :total-pages="history.pagination.last_page" :disabled="historyPending" /></footer>
      </AdminListState>
    </section>

    <div v-else class="grid gap-5 lg:grid-cols-2">
      <section v-if="recountable" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">{{ t('admin_pages.content.recount') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.recount_help') }}</p>
        <button type="button" :disabled="busy" class="mt-4 rounded-lg border px-4 py-2 text-sm disabled:opacity-40" @click="recount">{{ t('admin_pages.content.recount') }}</button>
      </section>
      <section v-if="type === 'artist'" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">{{ t('admin_pages.content.merge') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.merge_help') }}</p>
        <form class="mt-4 flex gap-2" @submit.prevent="previewMerge">
          <input v-model="mergeTarget" required inputmode="numeric" pattern="[0-9]+" :placeholder="t('admin_pages.content.merge_target')" :aria-label="t('admin_pages.content.merge_target')" class="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <button type="submit" class="rounded-lg border px-4 py-2 text-sm">{{ t('admin_pages.content.merge_preview') }}</button>
        </form>
        <div v-if="merge" class="mt-4 text-sm">
          <p>{{ t('admin_pages.content.merge_summary', { source: merge.source.name, target: merge.target.name, id: merge.target.id }) }}</p>
          <dl class="mt-2 space-y-1"><div v-for="item in merge.counts" :key="item.key" class="flex justify-between gap-4"><dt>{{ item.label }}</dt><dd>{{ item.count }}</dd></div></dl>
          <div v-if="merge.pending_revisions.length" role="alert" class="mt-3 text-red-700">
            <p>{{ t('admin_pages.content.merge_blocked') }}</p>
            <ul class="mt-1 list-inside list-disc"><li v-for="item in merge.pending_revisions" :key="item.id"><NuxtLink :to="`/admin/revisions/${item.id}`" class="underline">#{{ item.id }} {{ item.title }}</NuxtLink></li></ul>
          </div>
          <button type="button" :disabled="Boolean(merge.pending_revisions.length)" class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" @click="mergeOpen = true">{{ t('admin_pages.content.merge_confirm') }}</button>
        </div>
      </section>
      <section class="rounded-xl border border-red-200 bg-white p-5">
        <h2 class="font-semibold text-red-800">{{ t('admin_pages.content.delete') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.content.delete_help') }}</p>
        <button type="button" class="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700" @click="startDelete">{{ t('admin_pages.content.delete_preview') }}</button>
      </section>
    </div>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :confirm-disabled="Boolean(impact?.blockers.length)" :title="t('admin_pages.content.delete_title', { name })" :description="t('admin_pages.content.delete_help')" @confirm="confirmDelete">
      <AdminImpactPreview v-if="impact" :impact="impact" />
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="mergeOpen" :busy="busy" reason-required :title="t('admin_pages.content.merge')" :description="merge ? t('admin_pages.content.merge_summary', { source: merge.source.name, target: merge.target.name, id: merge.target.id }) : ''" @confirm="confirmMerge" />
  </div>
</template>
