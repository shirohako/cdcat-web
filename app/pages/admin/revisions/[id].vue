<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { RemovalPlan, Revision } from '~/types/revision'
import { errorName } from '~/utils/revisionErrors'
import { entityPath } from '~/utils/revisionLinks'

definePageMeta({ layout: 'admin', middleware: 'admin', validate: route => /^\d+$/.test(String(route.params.id)) })

const route = useRoute()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const decisionLabels: Record<Decision, string> = { 'approve': '通过', 'request_changes': '退回修改', 'reject': '拒绝' }
const decisionHelpLabels: Record<Decision, string> = { 'approve': '通过后所有修订项会和当前内容合并并写入，记录新版本。', 'request_changes': '提交人会收到通知，修改后可以再次提交。', 'reject': '驳回后提交人不能再修改这条修订。' }
const revisionConflictLabels: Record<string, string> = {
  field: '同一字段',
  duplicate: '重复',
  remove_modified: '删除了被改过的行',
  modify_removed: '修改了已删除的行',
  invalid: '合并后无效',
  entity_gone: '实体已删除或合并',
}
const revisionDoneLabels: Record<Decision, string> = { approve: '已通过', request_changes: '已退回', reject: '已驳回' }
const revisionKindLabels: Record<string, string> = { catalog: '目录', lyric: '歌词' }

const id = computed(() => String(route.params.id))
const { data: revision, pending, error, refresh } = await useAsyncData(() => `admin-revision-${id.value}`, () => $api<Revision>(`/v1/revisions/${id.value}`), { watch: [id] })

const canReview = computed(() => revision.value?.kind === 'lyric' ? hasPermission('lyrics.manage') : hasPermission('revisions.review'))
const reviewable = computed(() => canReview.value && revision.value?.status === 'pending')
const checkable = computed(() => canReview.value && revision.value?.status === 'approved' && revision.value.is_auto_approved && !revision.value.checked_at)
const needsManage = computed(() => !!revision.value?.requires_content_manage && !hasPermission('content.manage'))

const heading = computed(() => {
  const match = revision.value?.title?.match(/^([a-z]+): (.*)$/)
  return match ? `${entityTypeLabels[match[1] ?? ''] ?? match[1]} · ${match[2]}` : (revision.value?.title || `#${id.value}`)
})
/** How each item merges with the current content right now. */
const preview = computed(() => (revision.value?.preview ?? []).map(item => ({
  ...item,
  type: revision.value?.items?.find(entry => entry.ref === item.ref)?.resource_type ?? 'album',
  errorList: Object.entries(item.errors ?? {}),
})).filter(item => item.conflicts.length || item.errorList.length || item.impact))
const show = (value: unknown) => value === null || value === undefined ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)

/** Content the revision put live at submission, awaiting this review (docs/catalog/editing.md#待审内容). */
const liveContent = computed(() => Object.entries(revision.value?.pending_content ?? {})
  .flatMap(([type, rows]) => (rows ?? []).map(row => ({ type: type as CatalogType, ...row }))))
/** Possible duplicates of the revision's new albums, with the album each was submitted as. */
const duplicateGroups = computed(() => Object.entries(revision.value?.duplicates ?? {}).filter(([, candidates]) => candidates.length).map(([ref, candidates]) => {
  const item = revision.value?.items?.find(entry => entry.ref === ref)
  return { ref, albumId: item?.applied_at ? item.resource_id : null, acknowledged: item?.acknowledged_duplicate_ids ?? [], candidates }
}))

type Decision = 'approve' | 'request_changes' | 'reject'
const decision = ref<Decision | null>(null)
const dialogOpen = computed({ get: () => decision.value !== null, set: (value) => { if (!value) decision.value = null } })
// Rejecting removes the content the revision put live; the plan is shown and confirmed first.
const removal = ref<RemovalPlan | null>(null)
const removes = computed(() => decision.value === 'reject' && !!removal.value && (removal.value.delete.length > 0 || removal.value.keep.length > 0))
watch(decision, async (value) => {
  removal.value = null
  if (value !== 'reject' || !revision.value?.has_applied_items) return
  try {
    removal.value = (await $api<{ removal: RemovalPlan | null }>(`/v1/revisions/${revision.value.id}/pending-content`)).removal
  } catch (failure) {
    message.value = adminError(failure, '操作失败。')
  }
})
const approveComment = ref('')
const busy = ref(false)
const message = ref('')
const notice = ref('')

const decide = async (reason: string) => {
  if (!revision.value || !decision.value || busy.value) return
  const path = { approve: 'approve', request_changes: 'request-changes', reject: 'reject' }[decision.value]
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/revisions/${revision.value.id}/${path}`, {
      method: 'POST',
      body: decision.value === 'approve'
        ? { review_comment: approveComment.value.trim() || null, lock_version: revision.value.lock_version }
        : { review_comment: reason, ...(decision.value === 'reject' && removal.value ? { impact_checksum: removal.value.checksum } : {}) },
    })
    notice.value = revisionDoneLabels[decision.value]
    decision.value = null
  } catch (failure) {
    decision.value = null
    message.value = errorName(failure) === 'REVISION_DRAFT_CONFLICT' ? '提交人刚刚修改过这条修订，请查看最新内容后再审核。' : adminError(failure, '操作失败。')
  } finally {
    busy.value = false
    await refresh()
  }
}

const check = async () => {
  if (!revision.value) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/revisions/${revision.value.id}/check`, { method: 'POST' })
    notice.value = '已标记为已巡查'
    await refresh()
  } catch (failure) {
    message.value = adminError(failure, '操作失败。')
  } finally {
    busy.value = false
  }
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => heading.value) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/revisions" class="text-sm text-slate-500 hover:text-slate-900">← 返回列表</NuxtLink>

    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="revision">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">
              #{{ revision.id }} · {{ revisionKindLabels[revision.kind] }} · {{ revisionOriginLabels[revision.origin] }}
            </p>
            <h1 class="mt-1 text-2xl font-bold">{{ heading }}</h1>
            <p v-if="revision.summary" class="mt-2 whitespace-pre-line text-sm text-slate-700">{{ revision.summary }}</p>
            <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span v-if="revision.submitter">提交者：<NuxtLink :to="`/admin/users/${revision.submitter.id}`" class="underline">{{ revision.submitter.nickname || revision.submitter.username }}</NuxtLink></span>
              <span>提交时间：{{ time(revision.submitted_at) }}</span>
              <span v-if="revision.reviewer">审核人：{{ revision.reviewer.nickname || revision.reviewer.username }} · {{ time(revision.reviewed_at) }}</span>
              <span v-if="revision.checked_at">巡查时间：{{ time(revision.checked_at) }}</span>
            </p>
          </div>
          <RevisionStatusBadge :status="revision.status" />
        </header>

        <div v-if="reviewable || checkable" class="flex flex-wrap items-center gap-2">
          <template v-if="reviewable">
            <button type="button" :disabled="busy || needsManage" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-40" @click="decision = 'approve'">通过</button>
            <button type="button" :disabled="busy" class="rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm text-orange-700 disabled:opacity-40" @click="decision = 'request_changes'">退回修改</button>
            <button type="button" :disabled="busy" class="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 disabled:opacity-40" @click="decision = 'reject'">拒绝</button>
            <span v-if="needsManage" class="text-xs text-amber-700">批准删除实体或移除有依赖的曲目需要内容管理权限。</span>
          </template>
          <button v-if="checkable" type="button" :disabled="busy" class="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40" @click="check">标记已巡查</button>
          <span class="text-xs text-slate-500">审核人不能代改；要补充内容请自己另提一条修订。</span>
        </div>
        <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <div v-if="revision.review_comment" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p class="font-semibold">审核意见</p>
          <p class="mt-1 whitespace-pre-line">{{ revision.review_comment }}</p>
        </div>

        <div v-if="liveContent.length" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p class="font-semibold">已上线、等待本次审核的内容</p>
          <p class="mt-0.5 text-xs text-amber-800">这些内容在提交时已经公开，页面上标着「审核中」。通过后去掉标记；驳回会删除它们。</p>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <li v-for="entry in liveContent" :key="`${entry.type}:${entry.id}`">
              <span class="text-xs text-amber-700">{{ entityTypeLabels[entry.type] }}</span>
              <NuxtLink v-if="entityPath(entry.type, entry.id)" :to="entityPath(entry.type, entry.id)!" target="_blank" class="ml-1 underline">{{ entry.label }}</NuxtLink>
              <span v-else class="ml-1">{{ entry.label }}</span>
            </li>
          </ul>
        </div>

        <section v-for="group in duplicateGroups" :key="group.ref" class="rounded-xl border bg-white p-4 text-sm" :class="group.candidates.some(c => c.strength === 'strong') ? 'border-amber-300' : 'border-slate-200'">
          <h2 class="font-semibold">疑似重复的专辑</h2>
          <ul class="mt-2 divide-y divide-slate-100">
            <li v-for="candidate in group.candidates" :key="candidate.album_id" class="flex flex-wrap items-center gap-3 py-2">
              <img v-if="candidate.album.image_url" :src="candidate.album.image_url" alt="" class="h-10 w-10 rounded object-cover">
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/albums/${candidate.album.id}`" target="_blank" class="flex items-center gap-1.5 font-medium underline">
                  <span class="truncate">#{{ candidate.album.id }} {{ candidate.album.title }}</span>
                  <CatalogPendingBadge v-if="candidate.album.is_pending" />
                </NuxtLink>
                <p class="text-xs text-slate-500">
                  {{ candidate.strength === 'strong' ? '强匹配' : '标题相近' }} ·
                  {{ candidate.reasons.map(reason => `${reason.kind}: ${reason.value}`).join('；') }}
                  <span v-if="group.acknowledged.includes(candidate.album_id)" class="text-amber-700"> · 提交人已确认不是同一张</span>
                </p>
              </div>
              <NuxtLink
                v-if="group.albumId && !candidate.album.is_pending && hasPermission('content.manage')"
                :to="{ path: `/admin/content/albums/${group.albumId}`, query: { tab: 'actions', merge_target: candidate.album.id } }"
                class="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
              >合并到这张</NuxtLink>
            </li>
          </ul>
        </section>

        <section v-for="item in preview" :key="item.ref" class="rounded-xl border border-rose-200 bg-white p-4 text-sm">
          <h2 class="font-semibold text-rose-800">{{ entityTypeLabels[item.type] }}（{{ item.ref }}）与当前内容合并时的问题</h2>
          <div v-if="item.conflicts.length" class="mt-2">
            <p class="text-slate-600">这条修订和之后通过的修改改了同样的内容，需要提交人处理冲突；可以退回修改。</p>
            <table class="mt-2 w-full text-left text-xs">
              <thead class="text-slate-500"><tr><th class="py-1 pr-3">字段</th><th class="py-1 pr-3">基线</th><th class="py-1 pr-3">这条修订</th><th class="py-1">当前</th></tr></thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="conflict in item.conflicts" :key="conflict.id">
                  <td class="py-1.5 pr-3 font-mono">{{ conflict.path.join('.') }} <span class="text-rose-600">({{ revisionConflictLabels[conflict.kind] }})</span></td>
                  <td class="max-w-48 truncate py-1.5 pr-3" :title="show(conflict.base)">{{ show(conflict.base) }}</td>
                  <td class="max-w-48 truncate py-1.5 pr-3" :title="show(conflict.mine)">{{ show(conflict.mine) }}</td>
                  <td class="max-w-48 truncate py-1.5" :title="show(conflict.current)">{{ show(conflict.current) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul v-if="item.errorList.length" class="mt-2 list-inside list-disc text-rose-700">
            <li v-for="[path, problem] in item.errorList" :key="path"><span class="font-mono text-xs">{{ path }}</span> {{ problem }}</li>
          </ul>
          <AdminImpactPreview v-if="item.impact" :impact="item.impact" />
        </section>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section class="min-w-0 space-y-3">
            <h2 class="font-semibold">字段差异</h2>
            <RevisionItems :items="revision.items ?? []" :references="revision.references ?? {}" :approved="revision.status === 'approved'" />
          </section>
          <aside class="space-y-5 text-sm">
            <div v-if="revision.sources.length">
              <h2 class="mb-2 font-semibold">来源</h2>
              <ul class="space-y-1">
                <li v-for="source in revision.sources" :key="source" class="break-all">
                  <a v-if="/^https?:\/\//.test(source)" :href="source" target="_blank" rel="noopener nofollow" class="text-blue-700 underline">{{ source }}</a>
                  <span v-else>{{ source }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 class="mb-3 font-semibold">时间线</h2>
              <RevisionTimeline :events="revision.events ?? []" />
            </div>
          </aside>
        </div>
      </template>
    </AdminListState>

    <AdminConfirmDialog
      v-model="dialogOpen"
      :busy="busy"
      :reason-required="decision !== 'approve'"
      :title="decision ? decisionLabels[decision] : ''"
      :description="decision ? (removes ? '驳回后提交人不能再修改这条修订，提交时已上线的内容按下面的计划删除或保留。' : decisionHelpLabels[decision]) : ''"
      :confirm-phrase="removes ? `#${revision?.id}` : ''"
      :confirm-disabled="decision === 'reject' && (!!revision?.has_applied_items && !removal || !!removal?.blockers.length)"
      @confirm="decide"
    >
      <RevisionRemovalPlan v-if="removes && removal" class="mt-4 max-h-72 overflow-y-auto" :plan="removal" />
      <label v-if="decision === 'approve'" class="mt-4 block text-sm">
        审核意见（可选）
        <textarea v-model="approveComment" maxlength="2000" rows="3" class="mt-2 w-full rounded-lg border border-slate-300 p-2" />
      </label>
    </AdminConfirmDialog>
  </div>
</template>
