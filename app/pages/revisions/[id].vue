<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
      <button class="btn btn-ghost btn-sm mb-4" @click="router.back()">← Back</button>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div class="text-sm text-gray-500 flex flex-wrap items-center gap-2">
              <span class="badge badge-outline">{{ formatType(revision.resource_type) }}</span>
              <span>#{{ revision.id }}</span>
              <span v-if="revision.revision_number" class="text-gray-400">· Rev {{ revision.revision_number }}</span>
              <span
                v-if="revision.status"
                class="badge badge-sm"
                :class="getStatusBadgeClass(revision.status)"
              >
                {{ formatStatus(revision.status) }}
              </span>
            </div>
            <h1 class="text-2xl md:text-3xl font-semibold leading-tight mt-2">
              {{ revision.title || 'Untitled revision' }}
            </h1>
            <div class="flex flex-wrap items-center gap-3 mt-3">
              <span class="badge badge-sm" :class="getActionBadgeClass(revision.action)">
                {{ formatAction(revision.action) }}
              </span>
              <span class="text-sm text-gray-500">
                {{ formatDate(revision.created_at) }}
              </span>
            </div>
          </div>

          <!-- actions moved to bottom (approve/reject) -->
        </div>

        <div class="grid md:grid-cols-3 gap-4 mt-6">
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Action</div>
            <div class="stat-value text-lg">{{ formatAction(revision.action) }}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Changes</div>
            <div class="stat-value text-lg text-green-600">+{{ revision.additions || 0 }}</div>
            <div class="stat-desc text-red-600">-{{ revision.deletions || 0 }}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Submitter</div>
            <div class="stat-value text-lg">{{ revision.submitter?.name || 'Unknown' }}</div>
            <div class="stat-desc text-xs text-gray-500">ID: {{ revision.submitter?.id ?? '—' }}</div>
          </div>
        </div>

        <div class="mt-8">
          <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 class="text-lg font-semibold">Payload</h2>
            <div class="join">
              <button
                class="join-item btn btn-sm"
                :class="{ 'btn-active': activeTab === 'diff' }"
                :disabled="!hasPrevious"
                @click="activeTab = 'diff'"
              >
                Diff
              </button>
              <button
                class="join-item btn btn-sm"
                :class="{ 'btn-active': activeTab === 'current' }"
                @click="activeTab = 'current'"
              >
                Current
              </button>
              <button
                class="join-item btn btn-sm"
                :class="{ 'btn-active': activeTab === 'previous' }"
                :disabled="!hasPrevious"
                @click="activeTab = 'previous'"
              >
                Previous
              </button>
            </div>
          </div>

          <template v-if="activeTab === 'diff'">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-500">
                Added = green · Changed = yellow · Removed = red
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="text-sm text-gray-600">Previous</div>
              <div class="text-sm text-gray-600">Current</div>
            </div>

            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="grid grid-cols-1 md:grid-cols-2">
                <div class="hidden md:block bg-gray-50 px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                  Line
                </div>
                <div class="hidden md:block bg-gray-50 px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                  Line
                </div>
              </div>
              <div class="divide-y divide-gray-100">
                <div
                  v-for="(row, idx) in diffRows"
                  :key="idx"
                  class="grid grid-cols-1 md:grid-cols-2"
                >
                  <!-- Previous -->
                  <div
                    class="flex items-start gap-2 px-3 py-1.5 text-xs font-mono whitespace-pre-wrap break-all"
                    :class="lineClass(row.left?.type)"
                  >
                    <span class="text-gray-400 min-w-10right" v-if="row.left">
                      {{ row.left.lineNumber }}
                    </span>
                    <span v-else class="min-w-10" />
                    <span>{{ row.left?.text }}</span>
                  </div>

                  <!-- Current -->
                  <div
                    class="flex items-start gap-2 px-3 py-1.5 text-xs font-mono whitespace-pre-wrap break-all"
                    :class="lineClass(row.right?.type)"
                  >
                    <span class="text-gray-400 min-w-10 text-right" v-if="row.right">
                      {{ row.right.lineNumber }}
                    </span>
                    <span v-else class="min-w-10" />
                    <span>{{ row.right?.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'current'">
            <pre class="overflow-auto text-xs bg-white border border-gray-200 rounded-lg p-3 max-h-160">{{ prettyJson(revision.data) }}</pre>
          </template>

          <template v-else-if="activeTab === 'previous'">
            <template v-if="previous?.data">
              <pre class="overflow-auto text-xs bg-white border border-gray-200 rounded-lg p-3 max-h-160">{{ prettyJson(previous.data) }}</pre>
            </template>
            <div v-else class="text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg p-4 text-center">
              No previous version available.
            </div>
          </template>
        </div>

        <div class="mt-8">
          <h2 class="text-lg font-semibold mb-2">Metadata</h2>
          <div class="grid md:grid-cols-3 gap-4 text-sm">
            <div class="p-3 bg-base-200 rounded-lg">
              <p class="text-gray-500">Checksum</p>
              <p class="font-mono break-all text-xs">{{ revision.checksum || '—' }}</p>
            </div>
            <div class="p-3 bg-base-200 rounded-lg">
              <p class="text-gray-500">Updated</p>
              <p>{{ formatDate(revision.updated_at) || '—' }}</p>
            </div>
          </div>
        </div>

        <div v-if="revision.status === 'pending'" class="mt-10 flex flex-wrap gap-3">
          <button class="btn btn-success" :disabled="isMutating" @click="approve">
            <span v-if="isMutating && mutateAction === 'approve'" class="loading loading-spinner loading-xs mr-2"></span>
            Approve
          </button>
          <button class="btn btn-error btn-outline" :disabled="isMutating" @click="reject">
            <span v-if="isMutating && mutateAction === 'reject'" class="loading loading-spinner loading-xs mr-2"></span>
            Reject
          </button>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mt-6">
        <span>Failed to load: {{ error.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const route = useRoute();
const { $api } = useNuxtApp();

const { data, pending, error, refresh } = await useAsyncData(
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

const getActionBadgeClass = (action) => {
  const map = {
    create: 'badge-success',
    update: 'badge-info',
    delete: 'badge-error',
  };
  return map[action] || 'badge-ghost';
};

const getStatusBadgeClass = (status) => {
  const map = {
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
  };
  return map[status] || 'badge-ghost';
};

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

const hasPrevious = computed(() => !!previous.value?.data);
const activeTab = ref('diff');
const isMutating = ref(false);
const mutateAction = ref(null);

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
    await $api(`/v1/revisions/${revision.value.id}/${action}`, { method: 'POST' });
    router.push({ path: '/revisions' });
  } catch (err) {
    console.error(`Failed to ${action} revision`, err);
  } finally {
    mutateAction.value = null;
    isMutating.value = false;
  }
};

const approve = () => mutateStatus('approve');
const reject = () => mutateStatus('reject');
</script>
