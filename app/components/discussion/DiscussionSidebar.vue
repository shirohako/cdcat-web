<script setup lang="ts">
import { Hash, Lock, PenSquare, Search } from '@lucide/vue'

/** The forum navigation: start a topic, search, every category with its numbers, and popular tags. */
const props = defineProps<{ activeSlug?: string | null, newTopicQuery?: Record<string, string> }>()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { categories, categoryName, pending: categoriesPending } = useDiscussionCategories()
const { $api } = useNuxtApp()
const { tagName } = useTags()
// Loaded once per visit to the site. Lazy, so the page around it never waits for it in the browser.
const { data: tags, pending: tagsPending } = await useAsyncData('discussion-tags',
  () => $api<{ tags: import('~/types/discussion').DiscussionTagWithCount[] }>('/v1/discussions/tags').then(response => response.tags.filter(tag => tag.topics_count > 0).sort((a, b) => b.topics_count - a.topics_count).slice(0, 12)),
  { lazy: true, default: () => [], getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })
const isActive = (slug: string) => props.activeSlug === slug
</script>

<template>
  <aside class="space-y-4">
    <div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
      <NuxtLink
        :to="isAuthenticated ? { path: '/discussions/new', query: newTopicQuery } : { path: '/auth/login', query: { redirect: '/discussions/new' } }"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
      >
        <PenSquare :size="15" />{{ t('discussions.new_topic') }}
      </NuxtLink>
      <NuxtLink to="/discussions/search" class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden">
        <Search :size="15" />{{ t('discussions.search.title') }}
      </NuxtLink>
    </div>

    <nav class="overflow-hidden rounded-xl border border-slate-200/80 bg-white" :aria-label="t('discussions.categories')">
      <h2 class="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ t('discussions.categories') }}</h2>
      <NuxtLink to="/discussions" class="flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-slate-50" :class="!activeSlug ? 'bg-sky-50/70 font-semibold text-sky-700' : 'text-slate-700'">
        <span class="size-2 rounded-full bg-slate-300" aria-hidden="true" />{{ t('discussions.all_topics') }}
      </NuxtLink>
      <SkeletonStatus v-if="categoriesPending && !categories.length">
        <div v-for="row in 4" :key="row" class="flex items-center gap-2 px-4 py-2.5">
          <div class="skeleton size-2 shrink-0 rounded-full" />
          <div class="skeleton h-3 rounded-full" :class="['w-24', 'w-32', 'w-20', 'w-28'][row - 1]" />
        </div>
      </SkeletonStatus>
      <template v-for="category in categories" :key="category.id">
        <NuxtLink
          :to="`/discussions/c/${category.slug}`" class="flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-slate-50"
          :class="isActive(category.slug) ? 'bg-sky-50/70 font-semibold text-sky-700' : 'text-slate-700'"
        >
          <span class="size-2 shrink-0 rounded-full" :class="categoryTone(category.color).dot" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ categoryName(category) }}</span>
          <Lock v-if="category.visibility === 'moderators'" :size="11" class="text-slate-400" />
          <span class="text-[11px] tabular-nums text-slate-400">{{ category.stats.topics_count }}</span>
        </NuxtLink>
        <NuxtLink
          v-for="child in category.children" :key="child.id" :to="`/discussions/c/${child.slug}`"
          class="flex items-center gap-2 py-1.5 pl-9 pr-4 text-[13px] transition hover:bg-slate-50"
          :class="isActive(child.slug) ? 'bg-sky-50/70 font-semibold text-sky-700' : 'text-slate-500'"
        >
          <span class="min-w-0 flex-1 truncate">{{ categoryName(child) }}</span>
          <span class="text-[11px] tabular-nums text-slate-400">{{ child.stats.topics_count }}</span>
        </NuxtLink>
      </template>
    </nav>

    <SkeletonStatus v-if="tagsPending && !tags.length" class="rounded-xl border border-slate-200/80 bg-white p-4">
      <div class="skeleton mb-3 h-3 w-20 rounded-full" />
      <div class="flex flex-wrap gap-1.5">
        <div v-for="chip in 6" :key="chip" class="skeleton h-6 rounded-md" :class="['w-14', 'w-20', 'w-12', 'w-16', 'w-24', 'w-14'][chip - 1]" />
      </div>
    </SkeletonStatus>
    <section v-else-if="tags.length" class="rounded-xl border border-slate-200/80 bg-white p-4">
      <h2 class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ t('discussions.popular_tags') }}</h2>
      <div class="flex flex-wrap gap-1.5">
        <NuxtLink
          v-for="tag in tags" :key="tag.id" :to="`/discussions/tags/${tag.slug}`"
          class="inline-flex items-center gap-0.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-100 transition hover:bg-sky-50 hover:text-sky-700"
        >
          <Hash :size="11" class="text-slate-400" />{{ tagName(tag) }}<span class="ml-0.5 text-[10px] text-slate-400">{{ tag.topics_count }}</span>
        </NuxtLink>
      </div>
    </section>
  </aside>
</template>
