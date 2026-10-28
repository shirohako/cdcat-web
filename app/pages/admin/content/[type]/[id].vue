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
const contentCauseLabels: Record<string, string> = {
  bootstrap: '补建',
  create: '新建',
  edit: '编辑',
  delete: '删除',
  restore: '恢复',
  merge: '合并',
  relation: '关联变化',
  auto: '自动',
  purge: '清除',
}
const contentMergeAbsorbLabels: Record<string, string> = { titles: '新增的其他名称', links: '新增的链接', entries: '新增的关联条目', track_titles: '新增的曲目名称' }
const detailTabLabels: Record<string, string> = { edit: '编辑', history: '版本历史', actions: '维护操作', revisions: '相关修订' }

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
const name = computed(() => String(current.value?.document.title ?? current.value?.document.name ?? `${entityTypeLabels[type.value]} #${id.value}`))

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
    message.value = adminError(failure)
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
    notice.value = `已恢复，当前为第 ${result.version} 版。`
    await router.replace({ query: { ...route.query, restore: undefined } })
    await Promise.all([refresh(), refreshVersions()])
  } catch (failure) {
    message.value = adminError(failure)
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
const recountable = computed(() => ['album', 'artist'].includes(type.value))
const recount = async () => {
  busy.value = true
  message.value = ''
  try {
    const result = await $api<{ results: { changed: string[] }[] }>(`/v1/admin/content/${paths.value.api}/recount`, { method: 'POST', body: { ids: [Number(id.value)] } })
    const changed = result.results[0]?.changed ?? []
    notice.value = changed.length ? `已重算，变化的字段：${changed.join('、')}` : '已重算，统计没有变化。'
  } catch (failure) {
    message.value = adminError(failure)
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
    message.value = adminError(failure)
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
    message.value = adminError(failure)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}

// ===== Merge (albums, artists) =====
const mergeable = computed(() => mergeableContentTypes.includes(type.value))
const mergeKind = computed(() => type.value as 'album' | 'artist')
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
    message.value = adminError(failure)
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
    message.value = adminError(failure)
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
    message.value = adminError(failure)
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
    <NuxtLink :to="`/admin/content/${paths.api}`" class="text-sm text-slate-500 hover:text-slate-900">← 返回列表</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs text-slate-500">{{ entityTypeLabels[type] }} #{{ id }} · 当前第 {{ latest }} 版</p>
          <h1 class="mt-1 text-2xl font-bold">{{ name }}</h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <UiButton v-if="editor" :to="editor" variant="primary" size="sm">在编辑器中修改</UiButton>
          <UiButton v-if="hasPermission('audit.view')" :to="{ path: '/admin/audit', query: { target_type: type, target_id: id } }" size="sm">操作日志</UiButton>
          <UiButton :to="type === 'lyric' ? `/lyrics/${id}/versions` : `/${paths.front}/${id}`" target="_blank" size="sm">前台预览</UiButton>
        </div>
      </header>
    </AdminListState>

    <nav class="flex gap-2 border-b border-slate-200 text-sm">
      <button v-for="item in ['history', 'revisions', 'actions']" :key="item" type="button" :aria-pressed="tab === item" class="-mb-px border-b-2 px-3 py-2" :class="tab === item ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'" @click="tab = item">{{ detailTabLabels[item] }}</button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <template v-if="tab === 'history'">
      <section v-if="restore" class="rounded-xl border border-amber-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold">恢复到第 {{ restore.version }} 版（当前第 {{ restore.current_version }} 版）</h2>
          <UiButton size="xs" @click="restore = null">关闭</UiButton>
        </div>
        <p class="mt-1 text-sm text-slate-600">恢复会生成一条修订并立即生效，下面是恢复后相对当前内容的改动。已删除的行按原 ID 回来；收藏、评论等互动数据不会恢复。</p>
        <ul v-if="restore.problems.length" role="alert" class="mt-3 list-inside list-disc text-sm text-red-700">
          <li v-for="problem in restore.problems" :key="problem.path"><span class="font-mono text-xs">{{ problem.path }}</span> {{ problem.message }}</li>
        </ul>
        <AdminImpactPreview v-if="restore.impact" :impact="restore.impact" />
        <div class="mt-4">
          <p v-if="!restore.changes.length" class="text-sm text-slate-500">没有变化</p>
          <CatalogDiffView v-else :type="type as CatalogType" :changes="restore.changes" :references="restore.references" />
        </div>
        <UiButton v-if="canRestore" variant="primary" class="mt-4" :disabled="busy || !!restore.problems.length || !restore.changes.length || !!restore.impact?.blockers.length" @click="restoreOpen = true">确认恢复</UiButton>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white">
        <AdminListState :pending="versionsPending" :error="versionsError" :empty="!versions?.versions.length" @retry="refreshVersions()">
          <ol class="divide-y divide-slate-100">
            <li v-for="version in versions?.versions" :key="version.version" class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div class="min-w-0">
                <p class="font-medium">
                  第 {{ version.version }} 版
                  <span class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ contentCauseLabels[version.cause] }}</span>
                  <span v-if="version.is_deleted" class="ml-1 text-xs text-red-700">已删除</span>
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ version.actor?.nickname || version.actor?.username || '系统' }} · {{ time(version.created_at) }}
                  <template v-if="version.revision_id"> · <NuxtLink :to="`/admin/revisions/${version.revision_id}`" class="underline">#{{ version.revision_id }}</NuxtLink></template>
                  <template v-if="version.reason"> · {{ version.reason }}</template>
                </p>
              </div>
              <div class="flex gap-2">
                <UiButton :to="`/${paths.api}/${id}/versions?version=${version.version}`" target="_blank" size="xs">查看</UiButton>
                <UiButton v-if="canRestore && version.version !== latest && !version.is_deleted" size="xs" @click="previewRestore(version.version)">预览恢复</UiButton>
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
        <h2 class="font-semibold">重算统计</h2>
        <p class="mt-1 text-sm text-slate-600">按源数据重新计算曲目数、评论数、评分、收藏和追踪计数等派生统计。</p>
        <UiButton class="mt-4" :disabled="busy" @click="recount">重算统计</UiButton>
      </section>
      <section v-if="mergeable" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">合并到另一个{{ entityTypeLabels[type] }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ type === 'album' ? '以要保留的专辑为准：补进这张专辑的标题、其他名称、链接、关联条目和相关专辑，以及对应曲目的名称；收藏、追踪、评分、留言、文章和讨论的关联、种子转到保留方，同一用户只留一份。这张专辑的版本、品番、图片和制作人员不会保留。旧 ID 和对应上的曲目会跳转到保留方。' : '把这个重复项的所有引用（专辑、制作人员、属性、收藏等）改挂到要保留的一方，它的名称成为保留方的别名，然后删除它。旧 ID 会跳转到保留方。' }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span v-if="mergeTarget" class="rounded-lg bg-slate-100 px-3 py-2 text-sm">{{ mergeTarget.label }} #{{ mergeTarget.id }} <button type="button" class="ml-1 text-slate-500" @click="resetMerge">×</button></span>
          <EditorEntityPicker v-else :kind="mergeKind" :exclude="[Number(id)]" exclude-pending class="min-w-64" placeholder="搜索要保留的一方" @select="mergeTarget = { id: Number($event.id), label: $event.label }; trackMap = {}" />
          <UiButton :disabled="!mergeTarget" @click="previewMerge">预览合并</UiButton>
        </div>
        <div v-if="merge && mergeTarget" class="mt-4 text-sm">
          <p>将“{{ name }}”合并到“{{ mergeTarget.label }}”（#{{ mergeTarget.id }}）</p>
          <dl class="mt-2 space-y-1">
            <div v-for="(count, key) in merge.affected" :key="`a-${key}`" class="flex justify-between gap-4"><dt>受影响的{{ entityTypeLabels[key] }}</dt><dd>{{ count }}</dd></div>
            <div v-for="(count, key) in (merge.moves ? {} : merge.external)" :key="`e-${key}`" class="flex justify-between gap-4"><dt class="text-slate-500">{{ key }}</dt><dd>{{ count }}</dd></div>
          </dl>
          <dl v-if="merge.absorb && Object.keys(merge.absorb).length" class="mt-3 grid max-w-md gap-1">
            <div v-for="(count, key) in merge.absorb" :key="`b-${key}`" class="flex justify-between gap-4"><dt>{{ contentMergeAbsorbLabels[key] }}</dt><dd>{{ count }}</dd></div>
          </dl>
          <dl v-if="merge.moves && Object.values(merge.moves).some(Boolean)" class="mt-3 grid max-w-md gap-1">
            <dt class="font-medium">转到保留方的数据</dt>
            <div v-for="(count, key) in merge.moves" v-show="count" :key="`m-${key}`" class="flex justify-between gap-4">
              <dt class="text-slate-500">{{ key }}</dt><dd>{{ count }}<span v-if="merge.dropped?.[key]" class="ml-1 text-amber-700">（其中 {{ merge.dropped[key] }} 条重复，删除）</span></dd>
            </div>
          </dl>
          <ul v-if="merge.warnings?.length" class="mt-3 list-inside list-disc text-amber-800"><li v-for="warning in merge.warnings" :key="warning">{{ warning }}</li></ul>
          <div v-if="merge.source_tracks?.length" class="mt-4">
            <h3 class="font-medium">曲目对应</h3>
            <p class="mt-0.5 text-xs text-slate-500">默认按碟号和曲号对应，标黄的是标题不一致或没有对应的。没有对应的曲目，它的收藏会删除。</p>
            <AdminMergeTrackMap class="mt-2" :source-tracks="merge.source_tracks" :target-tracks="merge.target_tracks ?? []" :model-value="trackMap" :disabled="busy" @update:model-value="changeTrackMap" />
          </div>
          <ul v-if="merge.blockers.length" role="alert" class="mt-3 list-inside list-disc text-red-700"><li v-for="blocker in merge.blockers" :key="blocker">{{ blocker }}</li></ul>
          <UiButton variant="primary" class="mt-4" :disabled="Boolean(merge.blockers.length)" @click="mergeOpen = true">确认合并</UiButton>
        </div>
      </section>
      <section class="rounded-xl border border-red-200 bg-white p-5">
        <h2 class="font-semibold text-red-800">永久删除</h2>
        <p class="mt-1 text-sm text-slate-600">永久删除，不进回收站。会一并清理列出的子数据，并写入操作日志。</p>
        <UiButton variant="danger-soft" class="mt-4" @click="startDelete">预览删除影响</UiButton>
      </section>
    </div>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :confirm-phrase="`#${id}`" :confirm-disabled="Boolean(impact?.blockers.length)" :title="`删除“${name}”`" description="永久删除，不进回收站。会一并清理列出的子数据，并写入操作日志。" @confirm="confirmDelete">
      <AdminImpactPreview v-if="impact" :impact="impact" />
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="mergeOpen" :busy="busy" reason-required :confirm-phrase="mergeTarget ? `#${mergeTarget.id}` : ''" title="确认合并" :description="merge && mergeTarget ? `将“${name}”合并到“${mergeTarget.label}”（#${mergeTarget.id}）` : ''" @confirm="confirmMerge" />
    <AdminConfirmDialog v-model="restoreOpen" :busy="busy" reason-required title="确认恢复" description="恢复会立即生效，并留在版本历史里。请填写原因。" @confirm="confirmRestore" />
  </div>
</template>
