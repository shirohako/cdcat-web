<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-5xl">

      <!-- 返回 -->
      <button
        class="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
        @click="router.back()"
      >
        <ChevronLeft :size="15" />
        返回
      </button>

      <!-- 错误 -->
      <div v-if="error" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertCircle :size="32" class="mb-3 opacity-40" />
        <p class="text-sm">{{ error.message }}</p>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <!-- 面包屑标签 -->
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {{ formatType(revision.resource_type) }}
                </span>
                <span class="text-xs text-gray-400 font-mono">#{{ revision.id }}</span>
                <span v-if="revision.revision_number" class="text-xs text-gray-400">Rev {{ revision.revision_number }}</span>
              </div>

              <!-- 标题 -->
              <h1 class="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                {{ revision.title || 'Untitled' }}
              </h1>

              <!-- 元信息 -->
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <span
                  class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  :class="actionBadgeClass(revision.action)"
                >
                  {{ formatAction(revision.action) }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(revision.status)"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(revision.status)" />
                  {{ formatStatus(revision.status) }}
                </span>
                <span class="text-xs text-gray-400 tabular-nums">{{ formatDate(revision.created_at) }}</span>
              </div>
            </div>

            <!-- 提交者 -->
            <div class="flex items-center gap-2 sm:shrink-0">
              <img v-if="revision.submitter?.avatar" :src="revision.submitter.avatar" class="h-8 w-8 rounded-full object-cover" />
              <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                {{ revision.submitter?.nickname?.charAt(0) || revision.submitter?.username?.charAt(0) || '?' }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800">{{ revision.submitter?.nickname || revision.submitter?.username || '—' }}</p>
                <p class="text-xs text-gray-400">@{{ revision.submitter?.username || '—' }}</p>
              </div>
            </div>
          </div>
          <!-- Metadata -->
          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
            <div>
              <p class="text-xs text-gray-400 mb-0.5">Checksum</p>
              <p class="font-mono text-xs text-gray-700 break-all">{{ revision.checksum?.slice(0, 16) || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-0.5">提交时间</p>
              <p class="text-xs text-gray-700 tabular-nums">{{ formatDate(revision.created_at) || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-0.5">更新时间</p>
              <p class="text-xs text-gray-700 tabular-nums">{{ formatDate(revision.updated_at) || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Payload -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <!-- Tab bar -->
          <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
            <h2 class="text-sm font-semibold text-gray-700">Payload</h2>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                <button
                  v-for="tab in payloadTabs"
                  :key="tab.value"
                  class="rounded-md px-3 py-1 text-xs font-medium transition"
                  :class="activeTab === tab.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
                  :disabled="tab.requiresPrevious && !hasPrevious"
                  @click="activeTab = tab.value"
                >
                  {{ tab.label }}
                </button>
              </div>
              <button
                class="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                :title="activeTab === 'previous' ? '复制 Previous Payload' : '复制 Current Payload'"
                @click="copyActivePayload"
              >
                <CopyCheck v-if="copied" :size="13" class="text-emerald-500" />
                <Copy v-else :size="13" />
                Copy
              </button>
            </div>
          </div>

          <!-- Diff -->
          <template v-if="activeTab === 'diff'">
            <div class="grid grid-cols-2 border-b border-gray-100 bg-gray-50/60">
              <div class="px-4 py-2 text-xs font-medium text-gray-500 border-r border-gray-100">Previous</div>
              <div class="px-4 py-2 text-xs font-medium text-gray-500">Current</div>
            </div>
            <div class="divide-y divide-gray-100 max-h-150 overflow-auto">
              <div v-for="(row, idx) in diffRows" :key="idx" class="grid grid-cols-2">
                <div
                  class="flex items-start gap-2 px-3 py-1 text-xs font-mono whitespace-pre-wrap break-all border-r border-gray-100"
                  :class="lineClass(row.left?.type)"
                >
                  <span class="w-8 shrink-0 text-right text-gray-300 select-none">{{ row.left?.lineNumber ?? '' }}</span>
                  <span>{{ row.left?.text }}</span>
                </div>
                <div
                  class="flex items-start gap-2 px-3 py-1 text-xs font-mono whitespace-pre-wrap break-all"
                  :class="lineClass(row.right?.type)"
                >
                  <span class="w-8 shrink-0 text-right text-gray-300 select-none">{{ row.right?.lineNumber ?? '' }}</span>
                  <span>{{ row.right?.text }}</span>
                </div>
              </div>
            </div>
            <div class="border-t border-gray-100 bg-gray-50/60 px-4 py-2 text-xs text-gray-400">
              <span class="inline-flex items-center gap-1 mr-3"><span class="inline-block h-2 w-2 rounded-sm bg-green-200"></span> 新增</span>
              <span class="inline-flex items-center gap-1 mr-3"><span class="inline-block h-2 w-2 rounded-sm bg-amber-200"></span> 修改</span>
              <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-red-200"></span> 删除</span>
            </div>
          </template>

          <!-- Current -->
          <template v-else-if="activeTab === 'current'">
            <pre class="overflow-auto p-4 text-xs text-gray-700 max-h-150">{{ prettyJson(revision.data) }}</pre>
          </template>

          <!-- Previous -->
          <template v-else-if="activeTab === 'previous'">
            <pre v-if="previous?.data" class="overflow-auto p-4 text-xs text-gray-700 max-h-150">{{ prettyJson(previous.data) }}</pre>
            <div v-else class="px-5 py-10 text-center text-sm text-gray-400">无历史版本</div>
          </template>
        </div>

        <!-- 审核操作 -->
        <div v-if="revision.status === 'pending' && canReview" class="mt-4 flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            :disabled="isMutating"
            @click="approve"
          >
            <span v-if="isMutating && mutateAction === 'approve'" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            <CheckCircle v-else :size="14" />
            通过
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            :disabled="isMutating"
            @click="reject"
          >
            <span v-if="isMutating && mutateAction === 'reject'" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            <XCircle v-else :size="14" />
            拒绝
          </button>
        </div>
      </template>
    </div>

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
const router = useRouter();
const route = useRoute();
const { $api } = useNuxtApp();
const { hasPermission } = useAuth()
const canReview = hasPermission('revisions.review')

const { data, error } = await useAsyncData(
  () => `revision-${route.params.id}`,
  () => $api(`/v1/revisions/${route.params.id}`),
  { watch: [() => route.params.id] },
);

const revision = computed(() => data.value?.revision || {});
const previous = computed(() => data.value?.previous || null);

const formatType = (type) => {
  const typeMap = {
    work: 'Work',
    artist: 'Artist',
    series: 'Series',
    event: 'Event',
    entry: 'Entry',
  };
  return typeMap[type] || type || '—';
};

const formatAction = (action) => {
  const map = { create: 'Create', update: 'Update', delete: 'Delete' };
  return map[action] || action || '—';
};

const formatStatus = (status) => {
  const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return map[status] || status || '—';
};

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

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const prettyJson = (obj) => JSON.stringify(obj ?? {}, null, 2);

const payloadTabs = [
  { value: 'diff', label: 'Diff', requiresPrevious: true },
  { value: 'current', label: 'Current', requiresPrevious: false },
  { value: 'previous', label: 'Previous', requiresPrevious: true },
]

const hasPrevious = computed(() => !!previous.value?.data);
const activeTab = ref('diff');
const isMutating = ref(false);
const mutateAction = ref(null)

const toast = reactive({ show: false, message: '', type: 'success' })
let toastTimer = null
const showToast = (message, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, message, type })
  toastTimer = setTimeout(() => { toast.show = false }, 2500)
}

watchEffect(() => {
  if (!hasPrevious.value && activeTab.value === 'diff') {
    activeTab.value = 'current';
  }
  if (!hasPrevious.value && activeTab.value === 'previous') {
    activeTab.value = 'current';
  }
  if (hasPrevious.value && !['diff', 'current', 'previous'].includes(activeTab.value)) {
    activeTab.value = 'diff';
  }
});

// 生成逐行 diff 数据
const diffRows = computed(() => {
  const currLines = (prettyJson(revision.value?.data).split('\n'));

  if (!previous.value || !previous.value.data) {
    let rightNo = 1;
    return currLines.map(line => ({
      left: null,
      right: { text: line, lineNumber: rightNo++, type: 'added' },
    }));
  }

  const prevLines = (prettyJson(previous.value.data).split('\n'));

  // LCS 动态规划
  const m = prevLines.length;
  const n = currLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = prevLines[i] === currLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0; let j = 0;
  let leftNo = 1; let rightNo = 1;

  while (i < m && j < n) {
    if (prevLines[i] === currLines[j]) {
      rows.push({
        left: { text: prevLines[i], lineNumber: leftNo++, type: 'unchanged' },
        right: { text: currLines[j], lineNumber: rightNo++, type: 'unchanged' },
      });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ left: { text: prevLines[i], lineNumber: leftNo++, type: 'removed' }, right: null });
      i++;
    } else {
      rows.push({ left: null, right: { text: currLines[j], lineNumber: rightNo++, type: 'added' } });
      j++;
    }
  }
  while (i < m) {
    rows.push({ left: { text: prevLines[i], lineNumber: leftNo++, type: 'removed' }, right: null });
    i++;
  }
  while (j < n) {
    rows.push({ left: null, right: { text: currLines[j], lineNumber: rightNo++, type: 'added' } });
    j++;
  }

  // 将相邻的删除+新增标记为修改
  for (let k = 0; k < rows.length - 1; k++) {
    if (rows[k]?.left?.type === 'removed' && !rows[k].right && rows[k + 1]?.right?.type === 'added' && !rows[k + 1].left) {
      rows[k].left.type = 'changed';
      rows[k + 1].right.type = 'changed';
    }
  }

  return rows;
});

const lineClass = (type) => {
  switch (type) {
    case 'added':
      return 'bg-green-50 text-green-800 border-t border-b border-green-100';
    case 'removed':
      return 'bg-red-50 text-red-700 border-t border-b border-red-100';
    case 'changed':
      return 'bg-amber-50 text-amber-800 border-t border-b border-amber-100';
    default:
      return '';
  }
};

const mutateStatus = async (action) => {
  if (!revision.value?.id) return;
  isMutating.value = true;
  mutateAction.value = action;
  try {
    await $api(`/v1/admin/revisions/${revision.value.id}/${action}`, { method: 'POST' });
    router.push({ path: '/revisions' });
  } catch (err) {
    showToast(err?.data?.message || err?.message || `操作失败`, 'error')
  } finally {
    mutateAction.value = null;
    isMutating.value = false;
  }
};

const approve = () => mutateStatus('approve');
const reject = () => mutateStatus('reject');

const copied = ref(false);
let copiedTimer = null;

const copyActivePayload = async () => {
  const json = activeTab.value === 'previous'
    ? prettyJson(previous.value?.data)
    : prettyJson(revision.value?.data);
  try {
    await navigator.clipboard.writeText(json);
    if (copiedTimer) clearTimeout(copiedTimer);
    copied.value = true;
    copiedTimer = setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    showToast('复制失败', 'error');
  }
};
</script>
