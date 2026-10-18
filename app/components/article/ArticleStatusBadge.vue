<script setup lang="ts">
import type { ArticleStatus } from '~/types/article'

const props = defineProps<{ status: ArticleStatus }>()
const { t } = useI18n()
const tone: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-700',
  hidden: 'bg-amber-100 text-amber-700',
  locked: 'bg-rose-100 text-rose-700',
}
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-medium" :class="tone[props.status]">
    {{ t(`article_ui.statuses.${props.status}`) }}
  </span>
</template>
