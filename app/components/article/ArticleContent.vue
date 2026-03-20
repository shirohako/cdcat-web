<template>
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="px-6 md:px-10 py-8">
      <article
        ref="articleEl"
        class="butterfly-post prose max-w-none
               prose-headings:font-bold prose-headings:text-gray-900
               prose-h1:text-2xl prose-h2:text-xl
               prose-p:text-gray-600 prose-p:leading-[1.9]
               prose-a:text-violet-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
               prose-strong:text-gray-800
               prose-blockquote:not-italic prose-blockquote:text-gray-500
               prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
               prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:shadow-md
               prose-li:text-gray-600 prose-li:marker:text-violet-400
               prose-hr:border-gray-100 prose-img:rounded-xl prose-img:shadow-md"
        v-html="renderedContent"
      />
    </div>

    <div class="border-t border-gray-100 px-6 md:px-10 py-5 flex items-center justify-between text-sm text-gray-400">
      <NuxtLink
        to="/articles"
        class="inline-flex items-center gap-1.5 hover:text-violet-500 transition-colors group"
      >
        <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform duration-200" />
        返回文章列表
      </NuxtLink>
      <span>{{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from "lucide-vue-next";

const props = defineProps({
  renderedContent: { type: String, default: "" },
  publishedAt: { type: String, default: "" },
});

const articleEl = ref(null);
defineExpose({ articleEl });

const formattedDate = computed(() => {
  if (!props.publishedAt) return "";
  const d = new Date(props.publishedAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
</script>

<style scoped>
:deep(.butterfly-post h2) {
  padding-left: 0.75rem;
  border-left: 4px solid #7c3aed;
  margin-top: 2rem;
}

:deep(.butterfly-post blockquote) {
  background: #faf5ff;
  border-left: 4px solid #a78bfa;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 0.75rem 1rem;
}
</style>
