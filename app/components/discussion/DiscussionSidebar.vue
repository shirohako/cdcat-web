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
      <UiButton
        :to="isAuthenticated ? { path: '/discussions/new', query: newTopicQuery } : { path: '/auth/login', query: { redirect: '/discussions/new' } }"
        variant="primary" :icon="PenSquare"
      >
        {{ t('discussions.new_topic') }}
      </UiButton>
      <UiButton to="/discussions/search" :icon="Search" class="lg:hidden">
        {{ t('discussions.search.title') }}
      </UiButton>
    </div>

    <nav class="card overflow-hidden" :aria-label="t('discussions.categories')">
      <h2 class="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-meta">{{ t('discussions.categories') }}</h2>
      <NuxtLink to="/discussions" class="flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-150 ease-out" :class="!activeSlug ? 'bg-primary/10 font-semibold text-primary' : 'text-body hover:bg-card-hover active:bg-card-active'">
        <span class="size-2 rounded-full bg-faint" aria-hidden="true" />{{ t('discussions.all_topics') }}
      </NuxtLink>
      <SkeletonStatus v-if="categoriesPending && !categories.length">
        <div v-for="row in 4" :key="row" class="flex items-center gap-2 px-4 py-2.5">
          <div class="skeleton size-2 shrink-0 rounded-full" />
          <div class="skeleton h-3 rounded-full" :class="['w-24', 'w-32', 'w-20', 'w-28'][row - 1]" />
        </div>
      </SkeletonStatus>
      <template v-for="category in categories" :key="category.id">
        <NuxtLink
          :to="`/discussions/c/${category.slug}`" class="flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-150 ease-out"
          :class="isActive(category.slug) ? 'bg-primary/10 font-semibold text-primary' : 'text-body hover:bg-card-hover active:bg-card-active'"
        >
          <span class="size-2 shrink-0 rounded-full" :class="categoryTone(category.color).dot" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ categoryName(category) }}</span>
          <Lock v-if="category.visibility === 'moderators'" :size="11" class="text-meta" />
          <span class="text-[11px] tabular-nums text-meta">{{ category.stats.topics_count }}</span>
        </NuxtLink>
        <NuxtLink
          v-for="child in category.children" :key="child.id" :to="`/discussions/c/${child.slug}`"
          class="flex items-center gap-2 py-1.5 pl-9 pr-4 text-[13px] transition-colors duration-150 ease-out"
          :class="isActive(child.slug) ? 'bg-primary/10 font-semibold text-primary' : 'text-meta hover:bg-card-hover active:bg-card-active'"
        >
          <span class="min-w-0 flex-1 truncate">{{ categoryName(child) }}</span>
          <span class="text-[11px] tabular-nums text-meta">{{ child.stats.topics_count }}</span>
        </NuxtLink>
      </template>
    </nav>

    <SkeletonStatus v-if="tagsPending && !tags.length" class="card p-4">
      <div class="skeleton mb-3 h-3 w-20 rounded-full" />
      <div class="flex flex-wrap gap-1.5">
        <div v-for="chip in 6" :key="chip" class="skeleton h-6 rounded-md" :class="['w-14', 'w-20', 'w-12', 'w-16', 'w-24', 'w-14'][chip - 1]" />
      </div>
    </SkeletonStatus>
    <section v-else-if="tags.length" class="card p-4">
      <h2 class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-meta">{{ t('discussions.popular_tags') }}</h2>
      <div class="flex flex-wrap gap-1.5">
        <NuxtLink
          v-for="tag in tags" :key="tag.id" :to="`/discussions/tags/${tag.slug}`"
          class="inline-flex items-center gap-0.5 rounded-md bg-btn px-2 py-1 text-xs text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover active:bg-btn-active"
        >
          <Hash :size="11" class="opacity-60" />{{ tagName(tag) }}<span class="ml-0.5 text-[10px] opacity-60">{{ tag.topics_count }}</span>
        </NuxtLink>
      </div>
    </section>
  </aside>
</template>
