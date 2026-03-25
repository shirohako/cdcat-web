<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="container mx-auto px-4 py-8 max-w-5xl md:px-8">

      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">我的编辑记录</h1>
        <p class="mt-1 text-sm text-gray-500">你提交的所有词条编辑申请</p>
      </div>

      <!-- 加载 -->
      <div v-if="pending" class="flex items-center justify-center min-h-60">
        <div class="flex flex-col items-center gap-3 text-gray-400">
          <GitPullRequest :size="32" class="opacity-30" />
          <p class="text-sm">加载中…</p>
        </div>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-60">
        <div class="flex flex-col items-center gap-3 text-gray-400">
          <AlertCircle :size="32" class="opacity-40" />
          <p class="text-sm">{{ error.message }}</p>
        </div>
      </div>

      <div v-else>
        <div class="mb-4 text-xs text-gray-400">
          共 {{ pagination.total }} 条记录
        </div>

        <!-- Desktop 表格 -->
        <div class="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/60">
                <th class="w-14 px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">词条</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">修改主体</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">操作</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">提交者</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">状态</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500">提交时间</th>
                <th class="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="revision in revisionsData"
                :key="revision.id"
                class="group hover:bg-gray-50/70 transition-colors"
              >
                <td class="px-5 py-3.5 text-xs font-mono text-gray-500">
                  {{ revision.id }}
                </td>
                <!-- 词条标题 + checksum -->
                <td class="px-4 py-3.5">
                  <p class="font-medium text-gray-900 truncate max-w-xs" :title="revision.title">
                    {{ revision.title }}
                  </p>
                  <p class="mt-0.5 font-mono text-[10px] text-gray-400" :title="revision.checksum">
                    {{ revision.checksum?.slice(0, 12) }}
                  </p>
                </td>

                <!-- 修改主体 -->
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {{ formatType(revision.resource_type) }}
                    <template v-if="revision.action !== 'create' && revision.resource_id">
                      <span class="text-gray-400">:</span>
                      <span class="font-mono text-gray-500">{{ revision.resource_id }}</span>
                    </template>
                  </span>
                </td>

                <!-- 操作 -->
                <td class="px-4 py-3.5">
                  <span
                    class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                    :class="actionBadgeClass(revision.action)"
                  >
                    {{ formatAction(revision.action) }}
                  </span>
                </td>

                <!-- 提交者 -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="revision.submitter?.avatar"
                      :src="revision.submitter.avatar"
                      class="h-6 w-6 shrink-0 rounded-full object-cover"
                    />
                    <div v-else class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                      {{ revision.submitter?.nickname?.charAt(0) || revision.submitter?.username?.charAt(0) || '?' }}
                    </div>
                    <span class="text-xs text-gray-600">{{ revision.submitter?.nickname || revision.submitter?.username }}</span>
                  </div>
                </td>

                <!-- 状态 -->
                <td class="px-4 py-3.5">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    :class="statusBadgeClass(revision.status)"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(revision.status)" />
                    {{ formatStatus(revision.status) }}
                  </span>
                </td>

                <!-- 时间 -->
                <td class="px-4 py-3.5 text-xs tabular-nums text-gray-500">
                  {{ formatDate(revision.created_at) }}
                </td>

                <!-- 操作按钮 -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-1.5">
                    <button
                      class="whitespace-nowrap rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                      @click.stop="goToDetail(revision.id)"
                    >
                      详情
                    </button>
                    <button
                      v-if="revision.status === 'pending'"
                      class="whitespace-nowrap rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                      @click.stop="confirmRetract(revision)"
                    >
                      撤销
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="revisionsData.length === 0">
                <td colspan="8" class="px-5 py-16 text-center">
                  <GitPullRequest :size="28" class="mx-auto mb-3 text-gray-300" />
                  <p class="text-sm text-gray-400">暂无编辑记录</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile 卡片 -->
        <div class="space-y-2.5 md:hidden">
          <article
            v-for="revision in revisionsData"
            :key="revision.id"
            class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                    :class="actionBadgeClass(revision.action)"
                  >
                    {{ formatAction(revision.action) }}
                  </span>
                  <span class="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {{ formatType(revision.resource_type) }}
                  </span>
                </div>
                <p class="mt-2 font-medium text-gray-900 line-clamp-2">{{ revision.title }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ formatDate(revision.created_at) }}</p>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                :class="statusBadgeClass(revision.status)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(revision.status)" />
                {{ formatStatus(revision.status) }}
              </span>
            </div>

            <div class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button
                class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                @click="goToDetail(revision.id)"
              >
                查看详情
              </button>
              <button
                v-if="revision.resource_id"
                class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                @click="goToEntity(revision)"
              >
                查看词条
              </button>
              <button
                v-if="revision.status === 'pending'"
                class="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                @click="confirmRetract(revision)"
              >
                撤销
              </button>
            </div>
          </article>

          <div v-if="revisionsData.length === 0" class="flex flex-col items-center py-16 text-gray-400">
            <GitPullRequest :size="28" class="mb-3 opacity-40" />
            <p class="text-sm">暂无编辑记录</p>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.last_page > 1" class="mt-6 flex items-center justify-between">
          <p class="text-xs text-gray-400">
            第 {{ (pagination.current_page - 1) * pagination.per_page + 1 }}–{{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} 条
          </p>
          <div class="flex items-center gap-1">
            <button
              class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >
              <ChevronLeft :size="13" />
            </button>

            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition"
                :class="page === pagination.current_page
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <span v-else class="flex h-7 w-7 items-center justify-center text-xs text-gray-300">·</span>
            </template>

            <button
              class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >
              <ChevronRight :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <CommonConfirmDialog
      v-model="retractModal.open"
      variant="delete"
      confirm-text="确认撤销"
      title="撤销修订"
      :description="`确认撤销「${retractModal.revision?.title ?? ''}」吗？撤销后该修订将不再进入审核流程。`"
      @confirm="doRetract"
    />

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-5 right-5 z-60 flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium shadow-lg"
        :class="toast.type === 'error' ? 'border-red-200 text-red-700' : 'border-gray-200 text-gray-800'"
      >
        <AlertCircle v-if="toast.type === 'error'" :size="14" class="text-red-500" />
        <CheckCircle v-else :size="14" class="text-emerald-500" />
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { AlertCircle, CheckCircle, GitPullRequest, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1
  return page > 0 ? page : 1
})

const { $api } = useNuxtApp()

const { data: response, pending, error, refresh } = await useAsyncData(
  'revisions-list',
  () => $api('/v1/revisions', { query: { page: currentPage.value } }),
  { watch: [currentPage] },
)

const revisionsData = computed(() => response.value?.revisions || [])
const pagination = computed(() => response.value?.pagination ?? {
  total: 0, per_page: 15, current_page: 1, last_page: 1,
})

// ===== 格式化 =====
const formatType = (type) => ({ work: 'Work', artist: 'Artist', series: 'Series', event: 'Event', entry: 'Entry' }[type] || type)
const formatAction = (action) => ({ create: '新增', update: '编辑', delete: '删除' }[action] || action)
const formatStatus = (status) => ({ pending: '待审核', approved: '已通过', rejected: '已拒绝' }[status] || status)

const actionBadgeClass = (action) => ({
  create: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  update: 'bg-blue-50 border-blue-200 text-blue-700',
  delete: 'bg-red-50 border-red-200 text-red-600',
}[action] || 'bg-gray-50 border-gray-200 text-gray-600')

const statusBadgeClass = (status) => ({
  pending:  'bg-amber-50 border-amber-200 text-amber-700',
  approved: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rejected: 'bg-gray-50 border-gray-200 text-gray-500',
}[status] || 'bg-gray-50 border-gray-200 text-gray-500')

const statusDotClass = (status) => ({
  pending:  'bg-amber-400',
  approved: 'bg-emerald-500',
  rejected: 'bg-gray-300',
}[status] || 'bg-gray-300')

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

// ===== 分页 =====
const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i)
  if (current < last - 2) pages.push('...')
  pages.push(last)
  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return
  router.push({ query: { ...route.query, page: page === 1 ? undefined : page } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (id) => router.push(`/revisions/${id}`)
const goToEntity = (revision) => {
  const map = { work: 'works', artist: 'artists', series: 'series', event: 'events', entry: 'entries' }
  const prefix = map[revision.resource_type]
  router.push(prefix ? `/${prefix}/${revision.resource_id}` : `/revisions/${revision.id}`)
}

// ===== 撤销 =====
const retractModal = reactive({ open: false, revision: null })

const confirmRetract = (revision) => {
  retractModal.revision = revision
  retractModal.open = true
}

const doRetract = async () => {
  try {
    await $api(`/v1/revisions/${retractModal.revision.id}/retract`, { method: 'POST' })
    showToast('修订已撤销')
    await refresh()
  } catch (e) {
    const code = e?.code
    if (code === 'REVISION_NOT_OWNED') showToast('无法撤销他人的修订', 'error')
    else if (code === 'REVISION_CANNOT_RETRACT') showToast('该修订已审核，无法撤销', 'error')
    else showToast(e?.message || '撤销失败，请重试', 'error')
  }
}

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' })
let toastTimer = null
const showToast = (message, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, message, type })
  toastTimer = setTimeout(() => { toast.show = false }, 2500)
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(6px); }
</style>
