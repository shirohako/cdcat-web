<script setup lang="ts">
import { Bell, CheckCheck } from '@lucide/vue'
import type { NotificationItem, Pagination } from '~/types/article'

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
      <h1 class="inline-flex items-center gap-2 text-2xl font-bold text-slate-900"><Bell :size="22" />{{ t('notifications.title') }}</h1>
      <button v-if="unread" type="button" class="btn btn-outline btn-sm" @click="markRead(null)"><CheckCheck :size="14" />{{ t('notifications.mark_all') }}</button>
    </header>

    <nav class="mt-5 flex gap-1 border-b border-slate-200">
      <NuxtLink
        v-for="value in ['all', 'unread']" :key="value" :to="{ query: value === 'unread' ? { filter: 'unread' } : {} }"
        class="-mb-px border-b-2 px-3 py-2 text-sm" :class="filter === value ? 'border-violet-500 font-semibold text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'">
        {{ t(`notifications.filters.${value}`) }}<span v-if="value === 'unread' && unread" class="ml-1 tabular-nums">({{ unread }})</span>
      </NuxtLink>
    </nav>

    <CommonLoadError v-if="status === 'error' && data" class="mt-4" @retry="refresh()" />
    <SkeletonRows v-if="loading" page class="mt-4" :count="8" thumb="dot" />
    <p v-else-if="status === 'error' && !data" class="py-16 text-center text-sm text-rose-600">{{ localizeError(error) }}</p>
    <p v-else-if="!data?.notifications.length" class="py-16 text-center text-sm text-slate-400">{{ t('notifications.empty') }}</p>
    <ul
      v-else
      :key="revealKey"
      class="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white transition-opacity"
      :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
      :inert="refetching"
    >
      <li v-for="item in data.notifications" :key="item.id">
        <button type="button" class="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50" @click="openItem(item)">
          <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read ? 'bg-transparent' : 'bg-violet-500'" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm" :class="item.read ? 'text-slate-500' : 'font-medium text-slate-900'">{{ text(item) }}</span>
            <span v-if="detail(item)" class="mt-1 block line-clamp-2 text-xs text-slate-500">{{ detail(item) }}</span>
            <span class="mt-1 block text-[11px] text-slate-400">{{ date(item.updated_at) }}</span>
          </span>
        </button>
      </li>
    </ul>
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-6" :total-pages="data.pagination.last_page" :disabled="refetching" />
  </div>
</template>
