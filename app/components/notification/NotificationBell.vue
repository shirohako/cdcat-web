<script setup lang="ts">
import { Bell, CheckCheck } from '@lucide/vue'
import type { NotificationItem } from '~/types/article'

/**
 * The navbar bell: unread badge, polled every minute, and the latest notifications on click. The navbar binds
 * `v-model:open`, so opening it closes the navbar's other menus and they close it.
 */
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const { unread, refresh, startPolling, stopPolling } = useNotifications()
const { text, detail, link } = useNotificationText()

const open = defineModel<boolean>('open', { default: false })
const loading = ref(false)
const items = ref<NotificationItem[]>([])
const root = useTemplateRef<HTMLElement>('root')

onMounted(startPolling)
onBeforeUnmount(stopPolling)
watch(() => route.fullPath, () => {
  open.value = false
  void refresh()
})

async function toggle() {
  // With the navbar's v-model, `open` only changes once the navbar re-renders, so decide from the old value.
  const opening = !open.value
  open.value = opening
  if (!opening) return
  loading.value = true
  try {
    const response = await $api<{ notifications: NotificationItem[], unread_count: number }>('/v1/me/notifications', { query: { per_page: 8 } })
    items.value = response.notifications
    unread.value = response.unread_count
  }
  catch { items.value = [] }
  finally { loading.value = false }
}

async function markRead(ids: number[] | null) {
  try {
    const response = await $api<{ unread_count: number }>('/v1/me/notifications/read', { method: 'POST', body: ids ? { ids } : { all: true } })
    unread.value = response.unread_count
    items.value = items.value.map(item => ids === null || ids.includes(item.id) ? { ...item, read: true } : item)
  }
  catch { /* the badge corrects itself on the next poll */ }
}

async function openItem(item: NotificationItem) {
  if (!item.read) await markRead([item.id])
  const target = link(item)
  open.value = false
  if (target) await router.push(target)
}

const onClickOutside = (event: MouseEvent) => { if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

const ago = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  if (minutes < 60) return format.format(-Math.max(0, minutes), 'minute')
  if (minutes < 1440) return format.format(-Math.round(minutes / 60), 'hour')
  return format.format(-Math.round(minutes / 1440), 'day')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button" class="group btn btn-ghost btn-square relative" :class="{ 'bg-ghost-hover text-primary': open }"
      :aria-label="unread ? t('notifications.bell_unread', { count: unread }) : t('notifications.title')" :aria-expanded="open" @click.stop="toggle">
      <!-- 18px: at 20 the bell looks bigger than the navbar's other icons. On hover it rings (ui-bell-ring in ui.css). -->
      <Bell :size="18" class="origin-top motion-safe:group-hover:animate-[ui-bell-ring_0.9s_both]" />
      <span v-if="unread" class="absolute right-1 top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-on-primary">
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>
    <!-- On phones it spans the screen under the navbar, as the search box does; the bell isn't at the right edge. -->
    <UiDropdown :open="open" align="end" screen class="sm:w-80">
      <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span class="text-sm font-semibold text-title">{{ t('notifications.title') }}</span>
        <button v-if="unread" type="button" class="inline-flex items-center gap-1 text-xs text-meta transition-colors hover:text-primary" @click="markRead(null)">
          <CheckCheck :size="13" />{{ t('notifications.mark_all') }}
        </button>
      </div>
      <!-- Loading: rows shaped like the notifications, shimmering. -->
      <SkeletonStatus v-if="loading" class="divide-y divide-line">
        <div v-for="row in 3" :key="row" class="flex gap-2.5 px-4 py-3">
          <div class="skeleton mt-1.5 size-2 shrink-0 rounded-full" />
          <div class="flex-1 space-y-1.5">
            <div class="skeleton h-3 w-11/12 rounded-full" />
            <div class="skeleton h-2.5 w-1/3 rounded-full" />
          </div>
        </div>
      </SkeletonStatus>
      <!-- Nothing yet: a bell in a soft ring of the theme colour, and what will show up here. -->
      <div v-else-if="!items.length" class="flex flex-col items-center px-6 pb-7 pt-8 text-center">
        <span class="grid size-12 place-items-center rounded-full bg-primary/12 text-primary ring-8 ring-primary/5">
          <Bell :size="20" />
        </span>
        <p class="mt-4 text-sm font-semibold text-title">{{ t('notifications.empty') }}</p>
        <p class="mt-1 text-xs leading-5 text-meta">{{ t('notifications.empty_hint') }}</p>
      </div>
      <ul v-else class="max-h-96 divide-y divide-line overflow-y-auto">
        <li v-for="item in items" :key="item.id">
          <button type="button" class="flex w-full gap-2.5 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-ghost-hover" @click="openItem(item)">
            <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read ? 'bg-transparent' : 'bg-primary'" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm leading-snug" :class="item.read ? 'text-meta' : 'text-title'">{{ text(item) }}</span>
              <span v-if="detail(item)" class="mt-0.5 block truncate text-xs text-meta">{{ detail(item) }}</span>
              <span class="mt-0.5 block text-[11px] text-faint">{{ ago(item.updated_at) }}</span>
            </span>
          </button>
        </li>
      </ul>
      <NuxtLink to="/notifications" class="block border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors duration-150 ease-out hover:bg-ghost-hover">
        {{ t('notifications.view_all') }}
      </NuxtLink>
    </UiDropdown>
  </div>
</template>
