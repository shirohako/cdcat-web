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
    <section class="card overflow-hidden">
      <div class="border-b border-line p-6 pb-5">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.privacy.blocks_title') }}</h2>
        <p class="mt-1 text-sm text-meta">{{ t('account_pages.privacy.blocks_description') }}</p>
      </div>
      <div class="space-y-4 p-6">
        <form class="flex gap-2" @submit.prevent="block">
          <input v-model="username" maxlength="33" class="input min-w-0 flex-1" :placeholder="t('account_pages.privacy.username_placeholder')">
          <button type="submit" class="btn btn-sm" :disabled="busy || !username.trim()">{{ t('account_pages.privacy.block') }}</button>
        </form>
        <p v-if="message" class="text-sm" :class="failed ? 'text-danger' : 'text-success'" role="status">{{ message }}</p>
        <SkeletonRows v-if="loading" :count="3" thumb="round" />
        <ul v-else-if="blocks.length" class="divide-y divide-line rounded-xl bg-sunken">
          <li v-for="item in blocks" :key="item.user?.id" class="flex items-center gap-3 px-4 py-2.5">
            <DiscussionAvatar :user="item.user" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-title">{{ item.user?.nickname || item.user?.username }}</p>
              <p class="text-xs text-meta">@{{ item.user?.username }} · {{ t('account_pages.privacy.blocked_on', { date: formatDate(item.created_at) }) }}</p>
            </div>
            <button v-if="item.user" type="button" class="btn btn-ghost btn-xs" :disabled="busy" @click="unblock(item.user)">{{ t('account_pages.privacy.unblock') }}</button>
          </li>
        </ul>
        <UiEmpty v-else :title="t('account_pages.privacy.no_blocks')" :icon="UserX" />
      </div>
    </section>
  </div>
</template>
