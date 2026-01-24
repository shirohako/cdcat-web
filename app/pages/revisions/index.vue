<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Revisions</h1>
        <p class="text-gray-600">All submitted revisions pending review</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="pending" class="flex items-center justify-center min-h-100">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <AlertCircle :size="24" />
          <span>Failed to load: {{ error.message }}</span>
        </div>
      </div>

      <!-- 修订列表 -->
      <div v-else>
        <!-- 统计信息 -->
        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Found {{ pagination.total }} revisions
            <span v-if="pagination.total > 0" class="text-gray-500">
              (Page {{ pagination.current_page }} of {{ pagination.last_page }})
            </span>
          </div>
        </div>

        <!-- 列表 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Desktop table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="table w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left">Title</th>
                <th class="text-left">Type</th>
                <th class="text-left">Action</th>
                <th class="text-left">Changes</th>
                <th class="text-left">Submitter</th>
                <th class="text-left">Status</th>
                <th class="text-left">Created</th>
                <th class="text-left">Detail</th>
                <th class="text-left">Page</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="revision in revisionsData"
                  :key="revision.id"
                  class="hover:bg-gray-50 cursor-pointer"
                >
                  <td class="max-w-xs">
                    <div class="truncate font-medium" :title="revision.title">
                      {{ revision.title }}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-outline badge-sm">
                      {{ formatType(revision.resource_type) }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="getActionBadgeClass(revision.action)"
                    >
                      {{ formatAction(revision.action) }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-green-600">+{{ revision.additions }}</span>
                      <span class="text-red-600">-{{ revision.deletions }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {{ revision.submitter?.name?.charAt(0).toUpperCase() || '?' }}
                      </div>
                      <span class="text-sm">{{ revision.submitter?.name || 'Unknown' }}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="getStatusBadgeClass(revision.status)"
                    >
                      {{ formatStatus(revision.status) }}
                    </span>
                  </td>
                  <td class="text-sm text-gray-500">
                    {{ formatDate(revision.created_at) }}
                  </td>
                  <td class="text-sm">
                    <button
                      class="btn btn-primary btn-xs"
                      @click.stop="goToDetail(revision.id)"
                    >
                      View
                    </button>
                  </td>
                  <td class="text-sm">
                    <button
                      v-if="revision.resource_id"
                      class="btn btn-secondary btn-xs"
                      @click.stop="goToEntity(revision)"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="grid gap-4 p-4 md:hidden">
            <article
              v-for="revision in revisionsData"
              :key="revision.id"
              class="border border-gray-200 rounded-xl p-4 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.25)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-500">{{ formatType(revision.resource_type) }}</p>
                  <h2 class="font-semibold text-base leading-snug line-clamp-2" :title="revision.title">
                    {{ revision.title }}
                  </h2>
                </div>
                <span
                  class="badge badge-sm whitespace-nowrap"
                  :class="getActionBadgeClass(revision.action)"
                >
                  {{ formatAction(revision.action) }}
                </span>
              </div>

              <div class="mt-3 flex items-center gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-green-600 font-medium">+{{ revision.additions }}</span>
                  <span class="text-red-600 font-medium">-{{ revision.deletions }}</span>
                </div>
                <span class="text-gray-300">•</span>
                <span
                  class="badge badge-ghost badge-sm"
                  :class="getStatusBadgeClass(revision.status)"
                >
                  {{ formatStatus(revision.status) }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {{ revision.submitter?.name?.charAt(0).toUpperCase() || '?' }}
                  </div>
                  <span class="font-medium">{{ revision.submitter?.name || 'Unknown' }}</span>
                </div>
                <div class="text-right">
                  <p class="text-gray-500 text-xs">{{ formatDate(revision.created_at) }}</p>
                  <button
                    class="btn btn-primary btn-xs mt-1"
                    @click="goToDetail(revision.id)"
                  >
                    查看详情
                  </button>
                  <button
                    v-if="revision.resource_id"
                    class="btn btn-secondary btn-xs mt-1"
                    @click="goToEntity(revision)"
                  >
                    查看实体
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- 空状态 -->
          <div v-if="revisionsData.length === 0" class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <GitPullRequest :size="64" class="mx-auto" />
            </div>
            <p class="text-gray-500">No revisions found</p>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="pagination.last_page > 1" class="mt-8 flex justify-center">
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >
              &laquo;
            </button>

            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === pagination.current_page }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button
                v-else
                class="join-item btn btn-sm btn-disabled"
              >
                ...
              </button>
            </template>

            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AlertCircle, GitPullRequest } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取修订列表
const { data: response, pending, error } = await useAPI('/v1/revisions', {
  query: {
    page: currentPage.value,
  },
});

// 处理修订数据
const revisionsData = computed(() => {
  return response.value?.revisions || [];
});

// 分页信息
const pagination = computed(() => {
  if (!response.value?.pagination) {
    return {
      total: 0,
      per_page: 15,
      current_page: 1,
      last_page: 1,
    };
  }
  return response.value.pagination;
});

// 格式化类型
const formatType = (type) => {
  const typeMap = {
    work: 'Work',
    artist: 'Artist',
    series: 'Series',
    event: 'Event',
    entry: 'Entry',
  };
  return typeMap[type] || type;
};

// 格式化操作
const formatAction = (action) => {
  const actionMap = {
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
  };
  return actionMap[action] || action;
};

// 获取操作类型的样式
const getActionBadgeClass = (action) => {
  const classMap = {
    create: 'badge-success',
    update: 'badge-info',
    delete: 'badge-error',
  };
  return classMap[action] || 'badge-ghost';
};

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return statusMap[status] || status;
};

// 获取状态的样式
const getStatusBadgeClass = (status) => {
  const classMap = {
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
  };
  return classMap[status] || 'badge-ghost';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 计算可见的页码
const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages = [];

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < last - 2) {
      pages.push('...');
    }
    pages.push(last);
  }

  return pages;
});

// 跳转到指定页码
const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;

  router.push({
    query: {
      ...route.query,
      page: page === 1 ? undefined : page,
    },
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 跳转到详情页
const goToDetail = (id) => {
  if (!id) return;
  router.push({ path: `/revisions/${id}` });
};

// 跳转到实体详情页
const goToEntity = (revision) => {
  if (!revision?.resource_id) return;
  const type = revision.resource_type;
  const id = revision.resource_id;
  const routeMap = {
    work: `/works/${id}`,
    artist: `/artists/${id}`,
    series: `/series/${id}`,
    event: `/events/${id}`,
    entry: `/entries/${id}`,
  };
  const target = routeMap[type] || `/revisions/${revision.id}`;
  router.push({ path: target });
};
</script>
