<script setup lang="ts">
import { Search } from '@lucide/vue'
import type { Pagination } from '~/types/api'
import type { DiscussionPostSummary, DiscussionTopicCard } from '~/types/discussion'
import type { UiSelectOption } from '~/components/ui/Select.vue'

/** Searches topic titles and first posts, or every post's text; spoilers are never matched. */
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { flat, categoryName } = useDiscussionCategories()
const { ago } = useRelativeTime()
const q = computed(() => String(route.query.q ?? '').trim())
const scope = computed(() => route.query.scope === 'posts' ? 'posts' : 'topics')
const category = computed(() => route.query.category ? String(route.query.category) : '')
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
const categoryOptions = computed<UiSelectOption<string>[]>(() => [
  { value: '', label: t('discussions.search.all_categories') },
  ...flat.value.map(item => ({ value: item.slug, label: `${item.parent_id ? '\u3000' : ''}${categoryName(item)}` })),
])
const input = ref(q.value)
watch(q, (value) => { input.value = value })

const update = (changes: Record<string, string | null | undefined>) => {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, page: undefined, ...changes })) {
    if (value) query[key] = String(value)
  }
  router.push({ query })
}
const submit = () => update({ q: input.value.trim() || null })

const { data, status, error, refresh, loading, refetching, revealKey, revealClass } = await usePageData(
  () => `discussion-search-${JSON.stringify([q.value, scope.value, category.value, page.value])}`,
  async ({ signal, background }) => {
    if (q.value.replace(/\s/g, '').length < 2) return null
    return $api<{ topics?: DiscussionTopicCard[], posts?: DiscussionPostSummary[], pagination: Pagination }>('/v1/discussions/search', {
      query: { q: q.value, scope: scope.value, category: category.value || undefined, page: page.value },
      signal,
      progress: !background,
    })
  },
)

useSeoMeta({ title: () => q.value ? t('discussions.search.title_for', { q: q.value }) : t('discussions.search.title'), robots: 'noindex' })
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto max-w-4xl px-4 py-8 md:px-6">
      <nav class="mb-3 text-xs text-meta"><NuxtLink to="/discussions" class="transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.title') }}</NuxtLink> / {{ t('discussions.search.title') }}</nav>
      <form class="flex gap-2" role="search" @submit.prevent="submit">
        <label class="flex flex-1 items-center gap-2 rounded-xl border border-line bg-field px-3 transition-colors duration-150 ease-out focus-within:border-primary">
          <Search :size="16" class="text-meta" />
          <input v-model="input" type="search" maxlength="100" autofocus class="h-11 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-faint" :placeholder="t('discussions.search.placeholder')">
        </label>
        <button type="submit" class="btn btn-primary">{{ t('discussions.search.submit') }}</button>
      </form>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          v-for="value in ['topics', 'posts']" :key="value" type="button" class="chip"
          :class="{ 'chip-selected': scope === value }" @click="update({ scope: value === 'posts' ? 'posts' : null })"
        >
          {{ t(`discussions.search.scope.${value}`) }}
        </button>
        <UiSelect
          :model-value="category" :options="categoryOptions" size="sm" class="ml-auto" :aria-label="t('discussions.fields.category')"
          @update:model-value="value => update({ category: value || null })"
        />
      </div>

      <div class="mt-5">
        <p v-if="!q" class="py-16 text-center text-sm text-meta">{{ t('discussions.search.hint') }}</p>
        <template v-else-if="data">
          <CommonLoadError v-if="status === 'error'" class="mb-3" @retry="refresh()" />
          <p class="mb-3 text-xs text-meta">{{ t('discussions.search.results', { count: data.pagination.total }) }}</p>
          <div :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
            <DiscussionTopicList v-if="scope === 'topics'" :topics="data.topics ?? []" :empty="t('discussions.search.empty')" />
            <div v-else class="card divide-y divide-line overflow-hidden">
              <NuxtLink v-for="post in data.posts" :key="post.id" :to="`/discussions/${post.topic?.id}?post=${post.id}`" class="group block px-4 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
                <p class="text-sm font-semibold text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ post.topic?.title }}</p>
                <p class="mt-1 text-sm leading-6 text-body">{{ post.excerpt }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-meta">
                  <DiscussionCategoryBadge :category="post.topic?.category ?? null" :link="false" />
                  <span>{{ post.user?.nickname || post.user?.username }}</span>
                  <span>{{ post.floor ? `#${post.floor}` : t('discussions.search.reply_under', { floor: post.parent_floor }) }}</span>
                  <span>{{ ago(post.created_at) }}</span>
                </p>
              </NuxtLink>
              <UiEmpty v-if="!data.posts?.length" :title="t('discussions.search.empty')" :icon="Search" class="min-h-64" />
            </div>
          </div>
          <CommonPagination v-if="data.pagination.last_page > 1" class="mt-5" :page="data.pagination.current_page" :total-pages="data.pagination.last_page" :disabled="refetching" @update:page="value => update({ page: value > 1 ? String(value) : null })" />
        </template>
        <p v-else-if="status === 'error'" class="py-16 text-center text-sm text-meta">{{ localizeError(error) }}</p>
        <SkeletonRows v-else-if="loading" page :count="6" :thumb="scope === 'topics' ? 'round' : 'none'" />
      </div>
    </div>
  </div>
</template>
