<template>
  <div class="relative min-h-screen bg-base-100">
    <!-- 背景装饰 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-linear-to-br from-violet-200/40 to-indigo-200/20 blur-3xl" />
      <div class="absolute top-10 -right-20 h-72 w-72 rounded-full bg-linear-to-br from-sky-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-linear-to-br from-pink-200/25 to-rose-200/10 blur-3xl" />
    </div>

    <div class="relative container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
      <CollectionPageHeader
        :title="$t('content_display.articles')"
        :description="$t('content_display.articles_desc')"
        icon="lucide:newspaper"
        tone="indigo"
      >
        <template #action>
          <NuxtLink
            v-if="isAuthenticated"
            to="/articles/create"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
          >
            <PenLine :size="14" />
            <span class="hidden sm:inline">{{ $t('content_display.new_article') }}</span>
          </NuxtLink>
        </template>
      </CollectionPageHeader>
        </template>

      <!-- 加载状态 -->
      <CollectionLoadingSkeleton v-if="pending" variant="wide" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-60">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('common.load_failed') }}</span>
        </div>
      </div>

      <div v-else class="collection-content-enter">
        <!-- 文章列表 -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
        <div v-if="articles.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FileText :size="28" class="text-gray-300" />
          </div>
          <p class="text-gray-400 text-sm">{{ $t('content_display.no_articles') }}</p>
        </div>

        <CommonPagination
          class="mt-6"
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :disabled="pending"
          @update:page="goToPage"
        />
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup>
import { FileText, Calendar, UserRound, Image as ImageIcon, PenLine } from "@lucide/vue";

const { isAuthenticated } = useAuth();

useHead({ title: 'Articles | CDCAT' });

const route = useRoute();
const router = useRouter();


const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

const { data: response, pending, error } = useAPI("/v1/articles", {
  lazy: true,
  query: computed(() => ({ page: currentPage.value })),
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

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  router.push({ query: { ...route.query, page: page === 1 ? undefined : page } });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>
