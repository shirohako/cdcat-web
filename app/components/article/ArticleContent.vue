<template>
  <div class="card overflow-hidden">
    <div class="px-6 md:px-10 py-8">
      <article ref="articleEl">
        <RichContent :content="content" format="markdown" size="base" />
      </article>
    </div>

    <div class="border-t border-line px-6 md:px-10 py-5 flex items-center justify-between text-sm text-meta">
      <NuxtLink
        to="/articles"
        class="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
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
