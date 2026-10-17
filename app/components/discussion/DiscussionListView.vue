<script setup lang="ts">
import type { DiscussionTopicList } from '~/types/discussion'

type Tab = 'latest' | 'new' | 'hot' | 'featured' | 'unread' | 'watching'

/**
 * Tabs, filters and paging over a topic list. The state lives in the address
 * (`?tab=`, `?status=`, `?page=`), so lists can be shared and survive reloads.
 */
const props = withDefaults(defineProps<{ category?: string | null, tag?: string | null, question?: boolean, showCategory?: boolean }>(), { category: null, tag: null, question: false, showCategory: true })
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()

const tabs = computed<Tab[]>(() => isAuthenticated.value ? ['latest', 'new', 'hot', 'featured', 'unread', 'watching'] : ['latest', 'new', 'hot', 'featured'])
const tab = computed<Tab>(() => tabs.value.includes(route.query.tab as Tab) ? route.query.tab as Tab : 'latest')
const status = computed(() => ['solved', 'unsolved'].includes(String(route.query.status)) ? String(route.query.status) : null)
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))

const update = (changes: Record<string, string | null | undefined>) => {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, page: undefined, ...changes })) {
    if (value) query[key] = String(value)
  }
  router.push({ query })
}

const params = computed(() => ({
  category: props.category ?? undefined,
  tag: props.tag ?? undefined,
  sort: ['new', 'hot'].includes(tab.value) ? tab.value : 'latest',
  filter: ['featured', 'unread', 'watching'].includes(tab.value) ? tab.value : undefined,
  status: status.value ?? undefined,
  page: page.value,
}))
const { data, pending, error, refresh } = await useAsyncData(
  () => `discussion-list-${props.category ?? ''}-${props.tag ?? ''}`,
  () => $api<DiscussionTopicList>('/v1/discussions/topics', { query: params.value }),
  { watch: [params] },
)
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <nav class="flex flex-wrap gap-1" :aria-label="t('discussions.list.tabs')">
        <button
          v-for="value in tabs" :key="value" type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
          :class="tab === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'"
          :aria-pressed="tab === value" @click="update({ tab: value === 'latest' ? null : value })"
        >
          {{ t(`discussions.list.tab.${value}`) }}
        </button>
      </nav>
      <select
        v-if="question" :value="status ?? ''" class="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
        :aria-label="t('discussions.list.status')" @change="update({ status: ($event.target as HTMLSelectElement).value || null })"
      >
        <option value="">{{ t('discussions.list.status_all') }}</option>
        <option value="unsolved">{{ t('discussions.list.status_unsolved') }}</option>
        <option value="solved">{{ t('discussions.list.status_solved') }}</option>
      </select>
    </div>
    <div v-if="pending && !data" role="status" aria-live="polite" :aria-label="t('common.loading')" class="animate-pulse divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div v-for="row in 8" :key="row" class="flex items-center gap-3 px-4 py-4">
        <div class="size-9 shrink-0 rounded-full bg-slate-100" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 w-3/5 rounded-full bg-slate-200/80" />
          <div class="h-2.5 w-2/5 rounded-full bg-slate-100" />
        </div>
        <div class="hidden h-8 w-24 rounded-lg bg-slate-100 sm:block" />
      </div>
    </div>
    <div v-else-if="error" class="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      {{ t('common.load_failed') }}<button type="button" class="underline" @click="refresh()">{{ t('common.retry') }}</button>
    </div>
    <template v-else-if="data">
      <DiscussionTopicList
        :topics="data.topics" :pinned="data.pinned" :show-category="showCategory" :class="pending ? 'opacity-60' : ''"
        :empty="tab === 'unread' ? t('discussions.list.empty_unread') : tab === 'watching' ? t('discussions.list.empty_watching') : ''"
      />
      <CommonPagination
        v-if="data.pagination.last_page > 1" class="mt-5" :page="data.pagination.current_page" :total-pages="data.pagination.last_page"
        :disabled="pending" @update:page="value => update({ page: value > 1 ? String(value) : null })"
      />
    </template>
  </div>
</template>
