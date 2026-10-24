<script setup lang="ts">
import type { ArticleStatus } from '~/types/article'

const props = defineProps<{ status: ArticleStatus }>()
const { t } = useI18n()
const tone: Record<ArticleStatus, string> = {
  draft: 'bg-btn text-btn-content',
  published: 'bg-success/15 text-success',
  hidden: 'bg-warning/15 text-warning',
  locked: 'bg-danger/15 text-danger',
}
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-medium" :class="tone[props.status]">
    {{ t(`article_ui.statuses.${props.status}`) }}
  </span>
</template>
