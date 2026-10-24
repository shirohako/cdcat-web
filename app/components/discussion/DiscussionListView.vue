<script setup lang="ts">
import type { DiscussionTopicList } from '~/types/discussion'
import type { UiSelectOption } from '~/components/ui/Select.vue'

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
const statusOptions = computed<UiSelectOption<string>[]>(() => [
  { value: '', label: t('discussions.list.status_all') },
  { value: 'unsolved', label: t('discussions.list.status_unsolved') },
  { value: 'solved', label: t('discussions.list.status_solved') },
])
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
// Every parameter is part of the key, so a list shown again from the revisit cache matches the address.
const { data, status: loadStatus, refresh, loading, refetching, revealKey, revealClass } = await usePageData(
  () => `discussion-list-${JSON.stringify(params.value)}`,
  ({ signal, background }) => $api<DiscussionTopicList>('/v1/discussions/topics', { query: params.value, signal, progress: !background }),
)
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <nav class="flex flex-wrap gap-1" :aria-label="t('discussions.list.tabs')">
        <button
          v-for="value in tabs" :key="value" type="button"
          class="chip"
          :class="{ 'chip-selected': tab === value }"
          :aria-pressed="tab === value" @click="update({ tab: value === 'latest' ? null : value })"
        >
          {{ t(`discussions.list.tab.${value}`) }}
        </button>
      </nav>
      <UiSelect
        v-if="question" :model-value="status ?? ''" :options="statusOptions" size="sm" class="ml-auto"
        :aria-label="t('discussions.list.status')" @update:model-value="value => update({ status: value || null })"
      />
    </div>
    <template v-if="data">
      <CommonLoadError v-if="loadStatus === 'error'" class="mb-3" @retry="refresh()" />
      <DiscussionTopicList
        :key="revealKey"
        :topics="data.topics" :pinned="data.pinned" :show-category="showCategory"
        class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching"
        :empty="tab === 'unread' ? t('discussions.list.empty_unread') : tab === 'watching' ? t('discussions.list.empty_watching') : ''"
      />
      <CommonPagination
        v-if="data.pagination.last_page > 1" class="mt-5" :page="data.pagination.current_page" :total-pages="data.pagination.last_page"
        :disabled="refetching" @update:page="value => update({ page: value > 1 ? String(value) : null })"
      />
    </template>
    <div v-else-if="loadStatus === 'error'" class="card flex min-h-60 flex-col items-center justify-center gap-2 text-sm text-meta">
      {{ t('common.load_failed') }}<button type="button" class="link" @click="refresh()">{{ t('common.retry') }}</button>
    </div>
    <SkeletonStatus v-else-if="loading" page class="card divide-y divide-line overflow-hidden">
      <div v-for="row in 8" :key="row" class="flex items-center gap-3 px-4 py-4">
        <div class="skeleton size-9 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-3.5 w-3/5 rounded-full" />
          <div class="skeleton h-2.5 w-2/5 rounded-full" />
        </div>
        <div class="skeleton hidden h-8 w-24 rounded-lg sm:block" />
      </div>
    </SkeletonStatus>
  </div>
</template>
