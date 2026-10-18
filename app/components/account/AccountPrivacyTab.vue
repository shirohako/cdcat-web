<script setup lang="ts">
import { UserX } from '@lucide/vue'
import type { UserSummary } from '~/types/article'

/**
 * The block list. Blocked people's posts fold, their topics leave your lists and
 * their actions stop notifying you; they are not told. Moderators cannot be blocked.
 */
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { formatDate } = useLocaleFormatting()
const blocks = ref<{ user: UserSummary | null, created_at: string | null }[]>([])
const loading = ref(true)
const username = ref('')
const busy = ref(false)
const message = ref('')
const failed = ref(false)

async function load() {
  try {
    blocks.value = (await $api<{ blocks: typeof blocks.value }>('/v1/me/blocks')).blocks
  }
  catch (failure) {
    message.value = localizeError(failure)
    failed.value = true
  }
  finally {
    loading.value = false
  }
}
// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) load()
else onMounted(load)

async function run(request: () => Promise<unknown>, done: string) {
  busy.value = true
  message.value = ''
  failed.value = false
  try {
    await request()
    message.value = done
    await load()
  }
  catch (failure) {
    message.value = localizeError(failure)
    failed.value = true
  }
  finally {
    busy.value = false
  }
}

const block = () => {
  const name = username.value.trim().replace(/^@/, '')
  if (!name) return
  return run(() => $api(`/v1/me/blocks/${encodeURIComponent(name)}`, { method: 'PUT' }), t('account_pages.privacy.blocked', { name })).then(() => { username.value = '' })
}
const unblock = (user: UserSummary) => run(() => $api(`/v1/me/blocks/${encodeURIComponent(user.username)}`, { method: 'DELETE' }), t('account_pages.privacy.unblocked', { name: user.nickname || user.username }))
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      <div class="border-b border-gray-100 p-6 pb-5">
        <h2 class="text-base font-semibold text-gray-900">{{ t('account_pages.privacy.blocks_title') }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ t('account_pages.privacy.blocks_description') }}</p>
      </div>
      <div class="space-y-4 p-6">
        <form class="flex gap-2" @submit.prevent="block">
          <input v-model="username" maxlength="33" class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" :placeholder="t('account_pages.privacy.username_placeholder')">
          <button type="submit" class="btn btn-sm" :disabled="busy || !username.trim()">{{ t('account_pages.privacy.block') }}</button>
        </form>
        <p v-if="message" class="text-sm" :class="failed ? 'text-rose-600' : 'text-emerald-600'" role="status">{{ message }}</p>
        <SkeletonRows v-if="loading" :count="3" thumb="round" />
        <ul v-else-if="blocks.length" class="divide-y divide-gray-100 rounded-xl border border-gray-100">
          <li v-for="item in blocks" :key="item.user?.id" class="flex items-center gap-3 px-4 py-2.5">
            <DiscussionAvatar :user="item.user" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-800">{{ item.user?.nickname || item.user?.username }}</p>
              <p class="text-xs text-gray-400">@{{ item.user?.username }} · {{ t('account_pages.privacy.blocked_on', { date: formatDate(item.created_at) }) }}</p>
            </div>
            <button v-if="item.user" type="button" class="btn btn-ghost btn-xs" :disabled="busy" @click="unblock(item.user)">{{ t('account_pages.privacy.unblock') }}</button>
          </li>
        </ul>
        <div v-else class="flex flex-col items-center py-8 text-center">
          <div class="mb-3 grid size-12 place-items-center rounded-2xl bg-gray-50"><UserX :size="22" class="text-gray-300" /></div>
          <p class="text-sm text-gray-400">{{ t('account_pages.privacy.no_blocks') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
