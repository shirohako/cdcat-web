<script setup lang="ts">
import { Bell, CheckCheck } from '@lucide/vue'
import type { NotificationItem } from '~/types/article'

/** The navbar bell: unread badge, polled every minute, and the latest notifications on click. */
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const { unread, refresh, startPolling, stopPolling } = useNotifications()
const { text, detail, link } = useNotificationText()

const open = ref(false)
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
  open.value = !open.value
  if (!open.value) return
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
      type="button" class="relative grid size-9 place-items-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
      :aria-label="unread ? t('notifications.bell_unread', { count: unread }) : t('notifications.title')" :aria-expanded="open" @click.stop="toggle">
      <Bell :size="20" />
      <span v-if="unread" class="absolute right-1 top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>
    <transition name="dropdown">
      <div v-if="open" class="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <span class="text-sm font-semibold text-gray-900">{{ t('notifications.title') }}</span>
          <button v-if="unread" type="button" class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-violet-600" @click="markRead(null)">
            <CheckCheck :size="13" />{{ t('notifications.mark_all') }}
          </button>
        </div>
        <p v-if="loading" class="px-4 py-6 text-center text-xs text-gray-400">{{ t('common.loading') }}</p>
        <p v-else-if="!items.length" class="px-4 py-6 text-center text-xs text-gray-400">{{ t('notifications.empty') }}</p>
        <ul v-else class="max-h-96 divide-y divide-gray-50 overflow-y-auto">
          <li v-for="item in items" :key="item.id">
            <button type="button" class="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50" @click="openItem(item)">
              <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read ? 'bg-transparent' : 'bg-violet-500'" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm leading-snug" :class="item.read ? 'text-gray-500' : 'text-gray-900'">{{ text(item) }}</span>
                <span v-if="detail(item)" class="mt-0.5 block truncate text-xs text-gray-400">{{ detail(item) }}</span>
                <span class="mt-0.5 block text-[11px] text-gray-400">{{ ago(item.updated_at) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <NuxtLink to="/notifications" class="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-violet-600 hover:bg-violet-50">
          {{ t('notifications.view_all') }}
        </NuxtLink>
      </div>
    </transition>
  </div>
</template>
