<template>
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="px-6 md:px-10 py-8">
      <article ref="articleEl" class="butterfly-post">
        <RichContent :content="content" format="markdown" />
      </article>
    </div>

    <div class="border-t border-gray-100 px-6 md:px-10 py-5 flex items-center justify-between text-sm text-gray-400">
      <NuxtLink
        to="/articles"
        class="inline-flex items-center gap-1.5 hover:text-violet-500 transition-colors group"
      >
        <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform duration-200" />
        {{ $t('article_ui.back_to_list') }}
      </NuxtLink>
      <span>{{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from "@lucide/vue";

const props = defineProps({
  content: { type: String, default: "" },
  publishedAt: { type: String, default: "" },
});
const { formatDate } = useLocaleFormatting();

const articleEl = ref(null);
defineExpose({ articleEl });

const formattedDate = computed(() => {
  if (!props.publishedAt) return "";
  return formatDate(props.publishedAt, { year: 'numeric', month: '2-digit', day: '2-digit' });
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
