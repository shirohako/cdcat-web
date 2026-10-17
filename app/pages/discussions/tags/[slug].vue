<script setup lang="ts">
import { Hash } from '@lucide/vue'
import type { DiscussionTagWithCount } from '~/types/discussion'

/** Topics under one tag, across categories. */
const route = useRoute()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { tagName } = useTags()
const slug = computed(() => String(route.params.slug))
const { data: tag } = await useAsyncData(() => `discussion-tag-${slug.value}`,
  () => $api<{ tags: DiscussionTagWithCount[] }>('/v1/discussions/tags').then(response => response.tags.find(item => item.slug === slug.value) ?? null),
  { watch: [slug] })
const name = computed(() => tag.value ? tagName(tag.value) : slug.value)
useSeoMeta({ title: () => `#${name.value} - ${t('discussions.title')}` })
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DiscussionSidebar class="lg:sticky lg:top-20 lg:w-64 lg:shrink-0" />
        <main class="min-w-0 flex-1 space-y-5">
          <header class="rounded-2xl border border-slate-200/80 bg-white p-5">
            <nav class="mb-1 text-xs text-slate-400"><NuxtLink to="/discussions" class="hover:text-slate-600">{{ t('discussions.title') }}</NuxtLink> / {{ t('discussions.tag.label') }}</nav>
            <h1 class="flex items-center gap-1.5 text-2xl font-bold text-slate-950"><Hash :size="22" class="text-slate-400" />{{ name }}</h1>
            <p v-if="tag?.description" class="mt-1.5 text-sm text-slate-500">{{ tag.description }}</p>
            <p class="mt-2 text-xs text-slate-400">{{ t('discussions.category.topics', { count: tag?.topics_count ?? 0 }) }}</p>
          </header>
          <DiscussionListView :tag="slug" />
        </main>
      </div>
    </div>
    <DiscussionNotice />
  </div>
</template>
