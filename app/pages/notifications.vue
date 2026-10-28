<script setup lang="ts">
import { Bell, CheckCheck } from '@lucide/vue'
import type { NotificationItem } from '~/types/article'
import type { Pagination } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { unread } = useNotifications()
const { text, detail, link } = useNotificationText()

const filter = computed(() => route.query.filter === 'unread' ? 'unread' : 'all')
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
// About the reader themselves, so always fetched fresh (no revisit cache).
const { data, status, error, refresh, loading, refetching, revealKey, revealClass } = await usePageData(
  () => `notifications-page-${filter.value}-${page.value}`,
  ({ signal }) => $api<{ notifications: NotificationItem[], unread_count: number, pagination: Pagination }>('/v1/me/notifications', { query: { filter: filter.value, page: page.value }, signal }),
  { cache: false },
)
watch(data, (value) => { if (value) unread.value = value.unread_count })

async function markRead(ids: number[] | null) {
  const response = await $api<{ unread_count: number }>('/v1/me/notifications/read', { method: 'POST', body: ids ? { ids } : { all: true } })
  unread.value = response.unread_count
  await refresh()
}

async function openItem(item: NotificationItem) {
  if (!item.read) await markRead([item.id])
  const target = link(item)
  if (target) await router.push(target)
}

const date = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
useHead({ title: computed(() => t('notifications.title')) })
</script>

<template>
  <div class="container mx-auto max-w-3xl px-4 py-8 md:px-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="inline-flex items-center gap-2 text-2xl font-bold text-title"><Bell :size="22" class="text-primary" />{{ t('notifications.title') }}</h1>
      <UiButton v-if="unread" variant="outline" size="sm" :icon="CheckCheck" @click="markRead(null)">{{ t('notifications.mark_all') }}</UiButton>
    </header>

    <nav class="mt-5 flex gap-1 border-b border-line">
      <NuxtLink
        v-for="value in ['all', 'unread']" :key="value" :to="{ query: value === 'unread' ? { filter: 'unread' } : {} }"
        class="-mb-px border-b-2 px-3 py-2 text-sm transition-colors duration-150 ease-out" :class="filter === value ? 'border-primary font-semibold text-primary' : 'border-transparent text-meta hover:text-title'">
        {{ t(`notifications.filters.${value}`) }}<span v-if="value === 'unread' && unread" class="ml-1 tabular-nums">({{ unread }})</span>
      </NuxtLink>
    </nav>

    <CommonLoadError v-if="status === 'error' && data" class="mt-4" @retry="refresh()" />
    <SkeletonRows v-if="loading" page class="mt-4" :count="8" thumb="dot" />
    <p v-else-if="status === 'error' && !data" class="py-16 text-center text-sm text-danger">{{ localizeError(error) }}</p>
    <UiEmpty v-else-if="!data?.notifications.length" :title="t('notifications.empty')" :icon="Bell" class="mt-4" />
    <ul
      v-else
      :key="revealKey"
      class="card mt-4 divide-y divide-line overflow-hidden transition-opacity"
      :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
      :inert="refetching"
    >
      <li v-for="item in data.notifications" :key="item.id">
        <button type="button" class="flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active" @click="openItem(item)">
          <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read ? 'bg-transparent' : 'bg-primary'" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm" :class="item.read ? 'text-meta' : 'font-medium text-title'">{{ text(item) }}</span>
            <span v-if="detail(item)" class="mt-1 block line-clamp-2 text-xs text-meta">{{ detail(item) }}</span>
            <span class="mt-1 block text-[11px] text-meta">{{ date(item.updated_at) }}</span>
          </span>
        </button>
      </li>
    </ul>
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-6" :total-pages="data.pagination.last_page" :disabled="refetching" />
  </div>
</template>
