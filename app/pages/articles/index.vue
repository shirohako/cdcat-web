<template>
  <div class="relative min-h-screen bg-base-100">
    <!-- 背景装饰 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-linear-to-br from-violet-200/40 to-indigo-200/20 blur-3xl" />
      <div class="absolute top-10 -right-20 h-72 w-72 rounded-full bg-linear-to-br from-sky-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-linear-to-br from-pink-200/25 to-rose-200/10 blur-3xl" />
    </div>

    <div class="relative container mx-auto px-4 md:px-8 py-10 max-w-5xl">
      <!-- 页面标题 -->
      <div class="mb-10">
        <div class="flex items-center gap-2.5 mb-3">
          <div class="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <BookOpen :size="18" class="text-white" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Articles</h1>
        </div>
        <p class="text-gray-500 text-sm ml-11.5">音乐相关文章与资讯</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="pending" class="flex items-center justify-center min-h-60">
        <span class="loading loading-spinner loading-lg text-violet-400"></span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-60">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>加载失败: {{ error.message }}</span>
        </div>
      </div>

      <div v-else>
        <!-- 统计信息 -->
        <div class="mb-5 flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium ring-1 ring-violet-100">
            <FileText :size="12" />
            共 {{ pagination.total }} 篇
          </span>
        </div>

        <!-- 文章列表 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <NuxtLink
            v-for="article in articles"
            :key="article.id"
            :to="`/articles/${article.id}/${article.slug}`"
            class="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                   hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <!-- 封面 -->
            <div class="relative aspect-video overflow-hidden bg-gray-50">
              <img
                v-if="article.cover_url"
                :src="article.cover_url"
                :alt="article.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <ImageIcon :size="28" class="text-gray-200" />
              </div>
              <!-- 渐变遮罩 -->
              <div class="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <!-- 内容 -->
            <div class="flex flex-col flex-1 p-4">
              <!-- 标题 -->
              <h2 class="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2
                         group-hover:text-violet-600 transition-colors duration-200">
                {{ article.title }}
              </h2>

              <!-- 摘要 -->
              <p class="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                {{ excerpt(article.content) }}
              </p>

              <!-- 元信息 -->
              <div class="flex items-center gap-2.5 pt-3 border-t border-gray-50">
                <div class="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-gray-100">
                  <img v-if="article.author.avatar" :src="article.author.avatar" :alt="article.author.nickname" class="w-full h-full object-cover" />
                  <UserRound v-else :size="11" class="text-violet-400" />
                </div>
                <span class="text-xs text-gray-500 font-medium truncate">{{ article.author.nickname || article.author.username }}</span>
                <span class="text-gray-200 ml-auto shrink-0">·</span>
                <div class="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Calendar :size="11" />
                  <span>{{ formatDate(article.published_at) }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 空状态 -->
        <div v-if="articles.length === 0" class="text-center py-20">
          <div class="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FileText :size="28" class="text-gray-300" />
          </div>
          <p class="text-gray-400 text-sm">暂无文章</p>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.last_page > 1" class="mt-10 flex justify-center">
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >«</button>

            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === pagination.current_page }"
                @click="goToPage(page)"
              >{{ page }}</button>
              <button v-else class="join-item btn btn-sm btn-disabled">...</button>
            </template>

            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >»</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FileText, Calendar, UserRound, BookOpen, Image as ImageIcon } from "lucide-vue-next";

useHead({ title: 'Articles | CDCAT' });

const route = useRoute();
const router = useRouter();


const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

const { data: response, pending, error } = await useAPI("/v1/articles", {
  query: { page: currentPage.value },
});

const articles = computed(() => response.value?.articles ?? []);

const pagination = computed(() => response.value?.pagination ?? {
  total: 0, per_page: 15, current_page: 1, last_page: 1,
});

const excerpt = (content) => {
  if (!content) return "";
  return content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/>\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 120);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < last - 2) pages.push('...');
  pages.push(last);
  return pages;
});

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  router.push({ query: { ...route.query, page: page === 1 ? undefined : page } });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>
