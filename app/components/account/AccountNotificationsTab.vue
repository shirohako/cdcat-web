<script setup lang="ts">
import { Bell } from '@lucide/vue'
import type { MailSubscription } from '~/types/mail'

/**
 * Notification switches. Discussions add the first one: whether reactions to your posts notify you.
 * Below them, mail: the language mail is sent in and which kinds of group mail to receive.
 */
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const reactions = ref(true)
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const failed = ref(false)

const mailLocale = ref('en')
const subscriptions = ref<MailSubscription[]>([])
const mailSaving = ref(false)
const mailMessage = ref('')
const mailFailed = ref(false)

async function load() {
  try {
    const [settings, mail] = await Promise.all([
      $api<{ notification_preferences?: { reactions?: boolean }, mail_locale?: string }>('/v1/me/settings'),
      $api<{ mail_subscriptions: MailSubscription[] }>('/v1/me/mail-subscriptions'),
    ])
    reactions.value = settings.notification_preferences?.reactions ?? true
    mailLocale.value = settings.mail_locale ?? 'en'
    subscriptions.value = mail.mail_subscriptions
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

async function saveMail(change: () => Promise<void>) {
  mailSaving.value = true
  mailMessage.value = ''
  mailFailed.value = false
  try {
    await change()
    mailMessage.value = t('account_pages.notifications.saved')
  }
  catch (failure) {
    mailMessage.value = localizeError(failure)
    mailFailed.value = true
  }
  finally {
    mailSaving.value = false
  }
}

const changeMailLocale = (code: string) => saveMail(async () => {
  const settings = await $api<{ mail_locale: string }>('/v1/me/settings', { method: 'PUT', body: { mail_locale: code } })
  mailLocale.value = settings.mail_locale
})

const toggleMail = (key: string, subscribed: boolean) => saveMail(async () => {
  const item = await $api<MailSubscription>(`/v1/me/mail-subscriptions/${key}`, { method: subscribed ? 'PUT' : 'DELETE' })
  subscriptions.value = subscriptions.value.map(current => current.key === key ? item : current)
})
</script>

<template>
  <div class="space-y-6">
    <section class="card overflow-hidden">
      <div class="border-b border-line p-6 pb-5">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.notifications.title') }}</h2>
        <p class="mt-1 text-sm text-meta">{{ t('account_pages.notifications.description') }}</p>
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
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15"><Bell :size="18" class="text-primary" /></div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-title">{{ t('account_pages.notifications.reactions') }}</p>
            <p class="mt-0.5 text-xs text-meta">{{ t('account_pages.notifications.reactions_help') }}</p>
          </div>
          <button
            type="button" role="switch" :aria-checked="reactions" :disabled="saving"
            class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50" :class="reactions ? 'bg-primary' : 'bg-faint'" @click="toggle"
          >
            <span class="absolute top-0.5 size-5 rounded-full transition" :class="reactions ? 'left-5.5 bg-on-primary' : 'left-0.5 bg-on-media'" />
          </button>
        </div>
        <p v-if="message" class="mt-4 text-sm" :class="failed ? 'text-danger' : 'text-success'" role="status">{{ message }}</p>
        <p class="mt-6 text-xs text-meta">{{ t('account_pages.notifications.levels_hint') }}</p>
      </div>
    </section>

    <section class="card overflow-hidden">
      <div class="border-b border-line p-6 pb-5">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.notifications.mail_title') }}</h2>
        <p class="mt-1 text-sm text-meta">{{ t('account_pages.notifications.mail_description') }}</p>
      </div>
      <div class="p-6">
        <SkeletonStatus v-if="loading" class="space-y-4">
          <div class="skeleton h-10 w-full max-w-sm rounded-lg" />
          <div v-for="row in 3" :key="row" class="flex items-start gap-4">
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3.5 w-1/3 rounded-full" />
              <div class="skeleton h-3 w-2/3 rounded-full" />
            </div>
            <div class="skeleton h-6 w-11 shrink-0 rounded-full" />
          </div>
        </SkeletonStatus>
        <MailSettings v-else-if="subscriptions.length" :mail-locale="mailLocale" :subscriptions="subscriptions" :busy="mailSaving" @locale="changeMailLocale" @toggle="toggleMail" />
        <p v-if="mailMessage" class="mt-4 text-sm" :class="mailFailed ? 'text-danger' : 'text-success'" role="status">{{ mailMessage }}</p>
      </div>
    </section>
  </div>
</template>
