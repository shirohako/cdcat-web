<script setup lang="ts">
import { Hash } from '@lucide/vue'
import type { DiscussionTagWithCount } from '~/types/discussion'

/** Topics under one tag, across categories. */
const route = useRoute()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { tagName } = useTags()
const slug = computed(() => String(route.params.slug))
const { data: tag, loading } = await usePageData(() => `discussion-tag-${slug.value}`,
  ({ signal, background }) => $api<{ tags: DiscussionTagWithCount[] }>('/v1/discussions/tags', { signal, progress: !background })
    .then(response => response.tags.find(item => item.slug === slug.value) ?? null))
const name = computed(() => tag.value ? tagName(tag.value) : slug.value)
useSeoMeta({ title: () => `#${name.value} - ${t('discussions.title')}` })
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DiscussionSidebar class="lg:sticky lg:top-20 lg:w-64 lg:shrink-0" />
        <main class="min-w-0 flex-1 space-y-5">
          <header class="card p-5">
            <nav class="mb-1 text-xs text-meta"><NuxtLink to="/discussions" class="transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.title') }}</NuxtLink> / {{ t('discussions.tag.label') }}</nav>
            <h1 class="flex items-center gap-1.5 text-2xl font-bold text-title"><Hash :size="22" class="text-meta" />{{ name }}</h1>
            <SkeletonStatus v-if="loading" class="mt-2.5 space-y-2">
              <div class="skeleton h-3.5 w-1/2 rounded-full" />
              <div class="skeleton h-3 w-20 rounded-full" />
            </SkeletonStatus>
            <template v-else>
              <p v-if="tag?.description" class="mt-1.5 text-sm text-meta">{{ tag.description }}</p>
              <p class="mt-2 text-xs text-meta">{{ t('discussions.category.topics', { count: tag?.topics_count ?? 0 }) }}</p>
            </template>
          </header>
          <DiscussionListView :tag="slug" />
        </main>
      </div>
    </div>
    <DiscussionNotice />
  </div>
</template>
