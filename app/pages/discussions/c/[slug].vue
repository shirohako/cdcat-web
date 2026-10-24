<script setup lang="ts">
import { Archive, Lock, PenSquare, ShieldCheck } from '@lucide/vue'
import type { DiscussionCategoryDetail, NotificationLevel } from '~/types/discussion'

/** A category: its description and sub-categories, its topics (including sub-categories'), and its notification level. */
const route = useRoute()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { localizeError } = useLocalizedApiError()
const { categoryName, categoryDescription } = useDiscussionCategories()
const slug = computed(() => String(route.params.slug))
const { data: category, status, error, revealClass } = await usePageAPI<DiscussionCategoryDetail>(() => `/v1/discussions/categories/${slug.value}`)
const tone = computed(() => categoryTone(category.value?.color))
const level = ref<NotificationLevel | null>(null)
watch(category, (value) => { level.value = value?.notification_level ?? null }, { immediate: true })
const newTopic = computed(() => category.value ? { category: String(category.value.id) } : undefined)

usePageSeo({
  title: () => category.value ? `${categoryName(category.value)} - ${t('discussions.title')}` : t('discussions.title'),
  description: () => categoryDescription(category.value) || t('discussions.description'),
  noindex: () => category.value?.visibility === 'moderators',
  error,
  breadcrumbs: () => category.value
    ? [{ name: t('discussions.title'), path: '/discussions' }, { name: categoryName(category.value), path: `/discussions/c/${category.value.slug}` }]
    : null,
})
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div v-if="status === 'error' && !category" class="card p-10 text-center text-sm text-meta">{{ localizeError(error) }}</div>
      <!-- The sidebar and the topics don't need the category first: they render and load right away. -->
      <div v-else class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DiscussionSidebar class="lg:sticky lg:top-20 lg:w-64 lg:shrink-0" :active-slug="category?.slug ?? slug" :new-topic-query="newTopic" />
        <main class="min-w-0 flex-1 space-y-5">
          <header v-if="category" class="card overflow-hidden" :class="revealClass">
            <div class="h-1.5" :class="tone.dot" />
            <div class="flex flex-wrap items-start gap-4 p-5">
              <div class="min-w-0 flex-1">
                <nav v-if="category.parent" class="mb-1 text-xs text-meta">
                  <NuxtLink to="/discussions" class="transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.title') }}</NuxtLink> /
                  <NuxtLink :to="`/discussions/c/${category.parent.slug}`" class="transition-colors duration-150 ease-out hover:text-primary">{{ categoryName(category.parent) }}</NuxtLink>
                </nav>
                <h1 class="flex items-center gap-2 text-2xl font-bold text-title">
                  {{ categoryName(category) }}
                  <Lock v-if="category.visibility === 'moderators'" :size="16" class="text-meta" :aria-label="t('discussions.category.moderators_visible')" />
                  <Archive v-if="category.is_archived" :size="16" class="text-meta" :aria-label="t('discussions.category.archived')" />
                </h1>
                <p v-if="categoryDescription(category)" class="mt-1.5 text-sm leading-6 text-meta">{{ categoryDescription(category) }}</p>
                <p class="mt-2 flex flex-wrap gap-3 text-xs text-meta">
                  <span>{{ t('discussions.category.topics', { count: category.stats.topics_count }) }}</span>
                  <span v-if="category.kind === 'question'" class="text-success">{{ t('discussions.category.question') }}</span>
                  <span v-if="category.topic_permission === 'moderators'" class="inline-flex items-center gap-1"><ShieldCheck :size="12" />{{ t('discussions.category.moderators_only') }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <DiscussionLevelMenu v-if="isAuthenticated" v-model:level="level" kind="category" :target-id="category.id" />
                <NuxtLink
                  v-if="category.can.post" :to="{ path: '/discussions/new', query: newTopic }"
                  class="btn btn-primary btn-sm"
                >
                  <PenSquare :size="13" />{{ t('discussions.new_topic') }}
                </NuxtLink>
              </div>
            </div>
            <div v-if="category.children.length" class="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              <NuxtLink
                v-for="child in category.children" :key="child.id" :to="`/discussions/c/${child.slug}`"
                class="chip"
              >
                {{ categoryName(child) }}<span class="text-xs tabular-nums opacity-60">{{ child.stats.topics_count }}</span>
              </NuxtLink>
            </div>
          </header>
          <SkeletonStatus v-else page class="card overflow-hidden">
            <div class="h-1.5 bg-faint" />
            <div class="space-y-2.5 p-5">
              <div class="skeleton h-7 w-48 rounded-md" />
              <div class="skeleton h-3.5 w-2/3 rounded-full" />
              <div class="skeleton h-3 w-24 rounded-full" />
            </div>
          </SkeletonStatus>
          <DiscussionListView :category="category?.slug ?? slug" :question="category?.kind === 'question'" :show-category="(category?.children.length ?? 0) > 0" />
        </main>
      </div>
    </div>
    <DiscussionNotice />
  </div>
</template>
