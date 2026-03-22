<template>
  <div class="relative w-full h-72 md:h-96 overflow-hidden select-none">
    <img
      v-if="article.cover_url"
      :src="article.cover_url"
      :alt="article.title"
      class="absolute inset-0 w-full h-full object-cover scale-105"
      style="filter: brightness(0.6)"
    />
    <div
      v-else
      class="absolute inset-0 bg-linear-to-135deg from-violet-700 via-indigo-600 to-sky-500"
    />
    <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

    <!-- 标题 + 元信息 -->
    <div class="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 class="text-2xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg max-w-3xl mb-6">
        {{ article.title }}
      </h1>
      <div class="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
        <div class="flex items-center gap-1.5">
          <UserRound :size="14" />
          <span>{{ article.author.nickname || article.author.username }}</span>
        </div>
        <span class="opacity-40">|</span>
        <div class="flex items-center gap-1.5">
          <Calendar :size="14" />
          <span>{{ formatDate(article.published_at) }}</span>
        </div>
        <span class="opacity-40">|</span>
        <div class="flex items-center gap-1.5">
          <BookOpen :size="14" />
          <span>约 {{ wordCount }} 字</span>
        </div>
        <span class="opacity-40">|</span>
        <div class="flex items-center gap-1.5">
          <Clock :size="14" />
          <span>阅读约 {{ readingTime }} 分钟</span>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <NuxtLink
      to="/articles"
      class="absolute top-4 left-4 md:left-8 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white
             bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-200 group"
    >
      <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform duration-200" />
      返回
    </NuxtLink>

    <!-- 编辑按钮（仅作者可见） -->
    <NuxtLink
      v-if="isAuthor"
      :to="`/articles/${article.id}/edit`"
      class="absolute top-4 right-4 md:right-8 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white
             bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-200"
    >
      <Pencil :size="14" />
      编辑
    </NuxtLink>
  </div>
</template>

<script setup>
import { ArrowLeft, Calendar, UserRound, BookOpen, Clock, Pencil } from "lucide-vue-next";

const props = defineProps({
  article: { type: Object, required: true },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 1 },
});

const { user } = useAuth();
const isAuthor = computed(() => !!user.value && user.value.username === props.article?.author?.username);

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
</script>
