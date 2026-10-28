<script setup lang="ts">
import { FileText } from '@lucide/vue'
import type { ArticleCard, ContentLinkType } from '~/types/article'

/** Published articles linking a piece of content; renders nothing when there are none. */
const props = defineProps<{ type: ContentLinkType, id: number }>()
const { t } = useI18n()
const { typeName } = useArticleTypes()
const { $api } = useNuxtApp()
const { formatDate } = useLocaleFormatting()
const { data, revealClass } = await usePageData(`related-articles-${props.type}-${props.id}`,
  ({ signal, background }) => $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { link: `${props.type}:${props.id}`, per_page: 5 }, signal, progress: !background })
    .then(response => response.articles))
const articles = computed(() => data.value ?? [])
</script>

<template>
  <section v-if="articles.length" class="card overflow-hidden" :class="revealClass">
    <UiSectionTitle :title="t('article_ui.related.title')" :icon="FileText" class="px-5 pb-2 pt-4">
      <template #actions>
        <UiButton :to="{ path: '/articles', query: {} }" size="xs">{{ t('article_ui.related.all') }}</UiButton>
      </template>
    </UiSectionTitle>
    <div class="divide-y divide-line">
      <NuxtLink
        v-for="article in articles" :key="article.id" :to="article.slug ? `/articles/${article.id}/${article.slug}` : `/articles/${article.id}`"
        class="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
        <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
          <img v-if="article.cover_url" :src="article.cover_url" :alt="article.title" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
          <div v-else class="grid size-full place-items-center"><FileText :size="18" class="text-faint" /></div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium leading-snug text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ article.title }}</p>
          <p class="mt-1 text-[11px] text-meta">{{ [article.type ? typeName(article.type) : null, article.published_at ? formatDate(article.published_at) : null].filter(Boolean).join(' · ') }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
