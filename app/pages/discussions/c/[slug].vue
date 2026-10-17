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
const { data: category, error } = await useAPI<DiscussionCategoryDetail>(() => `/v1/discussions/categories/${slug.value}`, { watch: [slug] })
const tone = computed(() => categoryTone(category.value?.color))
const level = ref<NotificationLevel | null>(null)
watch(category, (value) => { level.value = value?.notification_level ?? null }, { immediate: true })
const newTopic = computed(() => category.value ? { category: String(category.value.id) } : undefined)

useSeoMeta({
  title: () => category.value ? `${categoryName(category.value)} - ${t('discussions.title')}` : t('discussions.title'),
  description: () => categoryDescription(category.value) || t('discussions.description'),
  robots: () => category.value?.visibility === 'staff' ? 'noindex' : undefined,
})
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div v-if="error" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{{ localizeError(error) }}</div>
      <div v-else-if="category" class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DiscussionSidebar class="lg:sticky lg:top-20 lg:w-64 lg:shrink-0" :active-slug="category.slug" :new-topic-query="newTopic" />
        <main class="min-w-0 flex-1 space-y-5">
          <header class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div class="h-1.5" :class="tone.dot" />
            <div class="flex flex-wrap items-start gap-4 p-5">
              <div class="min-w-0 flex-1">
                <nav v-if="category.parent" class="mb-1 text-xs text-slate-400">
                  <NuxtLink to="/discussions" class="hover:text-slate-600">{{ t('discussions.title') }}</NuxtLink> /
                  <NuxtLink :to="`/discussions/c/${category.parent.slug}`" class="hover:text-slate-600">{{ categoryName(category.parent) }}</NuxtLink>
                </nav>
                <h1 class="flex items-center gap-2 text-2xl font-bold text-slate-950">
                  {{ categoryName(category) }}
                  <Lock v-if="category.visibility === 'staff'" :size="16" class="text-slate-400" :aria-label="t('discussions.category.staff')" />
                  <Archive v-if="category.is_archived" :size="16" class="text-slate-400" :aria-label="t('discussions.category.archived')" />
                </h1>
                <p v-if="categoryDescription(category)" class="mt-1.5 text-sm leading-6 text-slate-500">{{ categoryDescription(category) }}</p>
                <p class="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>{{ t('discussions.category.topics', { count: category.stats.topics_count }) }}</span>
                  <span v-if="category.kind === 'question'" class="text-emerald-600">{{ t('discussions.category.question') }}</span>
                  <span v-if="category.topic_permission === 'moderators'" class="inline-flex items-center gap-1"><ShieldCheck :size="12" />{{ t('discussions.category.moderators_only') }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <DiscussionLevelMenu v-if="isAuthenticated" v-model:level="level" kind="category" :target-id="category.id" />
                <NuxtLink
                  v-if="category.can.post" :to="{ path: '/discussions/new', query: newTopic }"
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700"
                >
                  <PenSquare :size="13" />{{ t('discussions.new_topic') }}
                </NuxtLink>
              </div>
            </div>
            <div v-if="category.children.length" class="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
              <NuxtLink
                v-for="child in category.children" :key="child.id" :to="`/discussions/c/${child.slug}`"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {{ categoryName(child) }}<span class="ml-1.5 text-xs text-slate-400">{{ child.stats.topics_count }}</span>
              </NuxtLink>
            </div>
          </header>
          <DiscussionListView :category="category.slug" :question="category.kind === 'question'" :show-category="category.children.length > 0" />
        </main>
      </div>
    </div>
    <DiscussionNotice />
  </div>
</template>
