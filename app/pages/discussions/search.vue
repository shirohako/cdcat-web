<script setup lang="ts">
import { Search } from '@lucide/vue'
import type { Pagination } from '~/types/article'
import type { DiscussionPostSummary, DiscussionTopicCard } from '~/types/discussion'

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
  <div class="min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="container mx-auto max-w-4xl px-4 py-8 md:px-6">
      <nav class="mb-3 text-xs text-slate-400"><NuxtLink to="/discussions" class="hover:text-slate-600">{{ t('discussions.title') }}</NuxtLink> / {{ t('discussions.search.title') }}</nav>
      <form class="flex gap-2" role="search" @submit.prevent="submit">
        <label class="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-sky-400">
          <Search :size="16" class="text-slate-400" />
          <input v-model="input" type="search" maxlength="100" autofocus class="h-11 flex-1 bg-transparent text-sm outline-none" :placeholder="t('discussions.search.placeholder')">
        </label>
        <button type="submit" class="btn btn-primary">{{ t('discussions.search.submit') }}</button>
      </form>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          v-for="value in ['topics', 'posts']" :key="value" type="button" class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
          :class="scope === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'" @click="update({ scope: value === 'posts' ? 'posts' : null })"
        >
          {{ t(`discussions.search.scope.${value}`) }}
        </button>
        <select :value="category" class="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600" :aria-label="t('discussions.fields.category')" @change="update({ category: ($event.target as HTMLSelectElement).value || null })">
          <option value="">{{ t('discussions.search.all_categories') }}</option>
          <option v-for="item in flat" :key="item.id" :value="item.slug">{{ item.parent_id ? '\u3000' : '' }}{{ categoryName(item) }}</option>
        </select>
      </div>

      <div class="mt-5">
        <p v-if="!q" class="py-16 text-center text-sm text-slate-400">{{ t('discussions.search.hint') }}</p>
        <template v-else-if="data">
          <CommonLoadError v-if="status === 'error'" class="mb-3" @retry="refresh()" />
          <p class="mb-3 text-xs text-slate-400">{{ t('discussions.search.results', { count: data.pagination.total }) }}</p>
          <div :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
            <DiscussionTopicList v-if="scope === 'topics'" :topics="data.topics ?? []" :empty="t('discussions.search.empty')" />
            <div v-else class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
              <NuxtLink v-for="post in data.posts" :key="post.id" :to="`/discussions/${post.topic?.id}?post=${post.id}`" class="block px-4 py-3 transition hover:bg-slate-50">
                <p class="text-sm font-semibold text-slate-800">{{ post.topic?.title }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-600">{{ post.excerpt }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <DiscussionCategoryBadge :category="post.topic?.category ?? null" :link="false" />
                  <span>{{ post.user?.nickname || post.user?.username }}</span>
                  <span>{{ post.floor ? `#${post.floor}` : t('discussions.search.reply_under', { floor: post.parent_floor }) }}</span>
                  <span>{{ ago(post.created_at) }}</span>
                </p>
              </NuxtLink>
              <p v-if="!data.posts?.length" class="py-16 text-center text-sm text-slate-400">{{ t('discussions.search.empty') }}</p>
            </div>
          </div>
          <CommonPagination v-if="data.pagination.last_page > 1" class="mt-5" :page="data.pagination.current_page" :total-pages="data.pagination.last_page" :disabled="refetching" @update:page="value => update({ page: value > 1 ? String(value) : null })" />
        </template>
        <p v-else-if="status === 'error'" class="py-16 text-center text-sm text-slate-500">{{ localizeError(error) }}</p>
        <SkeletonRows v-else-if="loading" page :count="6" :thumb="scope === 'topics' ? 'round' : 'none'" />
      </div>
    </div>
  </div>
</template>
