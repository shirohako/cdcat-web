<script setup lang="ts">
import { Bell } from '@lucide/vue'

/** Notification switches. Discussions add the first one: whether reactions to your posts notify you. */
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const reactions = ref(true)
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const failed = ref(false)

async function load() {
  try {
    const settings = await $api<{ notification_preferences?: { reactions?: boolean } }>('/v1/me/settings')
    reactions.value = settings.notification_preferences?.reactions ?? true
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

async function toggle() {
  saving.value = true
  message.value = ''
  failed.value = false
  const next = !reactions.value
  try {
    await $api('/v1/me/settings', { method: 'PUT', body: { notification_preferences: { reactions: next } } })
    reactions.value = next
    message.value = t('account_pages.notifications.saved')
  }
  catch (failure) {
    message.value = localizeError(failure)
    failed.value = true
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      <div class="border-b border-gray-100 p-6 pb-5">
        <h2 class="text-base font-semibold text-gray-900">{{ t('account_pages.notifications.title') }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ t('account_pages.notifications.description') }}</p>
      </div>
      <div class="p-6">
        <SkeletonStatus v-if="loading" class="flex items-start gap-4">
          <div class="skeleton size-10 shrink-0 rounded-xl" />
          <div class="flex-1 space-y-2">
            <div class="skeleton h-3.5 w-1/3 rounded-full" />
            <div class="skeleton h-3 w-2/3 rounded-full" />
          </div>
          <div class="skeleton h-6 w-11 shrink-0 rounded-full" />
        </SkeletonStatus>
        <div v-else class="flex items-start gap-4">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50"><Bell :size="18" class="text-blue-500" /></div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900">{{ t('account_pages.notifications.reactions') }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ t('account_pages.notifications.reactions_help') }}</p>
          </div>
          <button
            type="button" role="switch" :aria-checked="reactions" :disabled="saving"
            class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50" :class="reactions ? 'bg-blue-600' : 'bg-gray-300'" @click="toggle"
          >
            <span class="absolute top-0.5 size-5 rounded-full bg-white shadow transition" :class="reactions ? 'left-5.5' : 'left-0.5'" />
          </button>
        </div>
        <p v-if="message" class="mt-4 text-sm" :class="failed ? 'text-rose-600' : 'text-emerald-600'" role="status">{{ message }}</p>
        <p class="mt-6 text-xs text-gray-400">{{ t('account_pages.notifications.levels_hint') }}</p>
      </div>
    </section>
  </div>
</template>
