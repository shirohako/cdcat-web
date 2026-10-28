<script setup lang="ts">
import { CheckCircle, Info, Link2Off, MailX, Settings } from '@lucide/vue'
import type { MailPreferences } from '~/types/mail'

/**
 * Mail settings behind the signed link in every group mail, without signing in
 * (docs/mail/README.md#免登录退订). Opening the page never changes anything — mail scanners
 * open links before people do — so every change waits for a click.
 */
const route = useRoute()
const { $api } = useNuxtApp()
const { t, locale } = useI18n()
const { localizeError } = useLocalizedApiError()
const endpoint = computed(() => `/v1/mail/preferences/${encodeURIComponent(String(route.params.token))}`)

const preferences = ref<MailPreferences | null>(null)
const loading = ref(true)
const invalid = ref(false)
const loadError = ref('')
const busy = ref(false)
const message = ref('')
const failed = ref(false)
/** What the last button did, for the confirmation at the top. */
const done = ref<'category' | 'all' | null>(null)

const isInvalidLink = (failure: unknown) => {
  const error = failure as { name?: string, status?: number } | null
  return error?.name === 'MAIL_LINK_INVALID' || error?.status === 404
}

// Loaded in the browser: the API limits these links per IP, and server renders would all share one.
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    preferences.value = await $api<MailPreferences>(endpoint.value)
  }
  catch (failure) {
    if (isInvalidLink(failure)) invalid.value = true
    else loadError.value = localizeError(failure)
  }
  finally {
    loading.value = false
  }
}
if (import.meta.client && !useNuxtApp().isHydrating) load()
else onMounted(load)

/** Saves one change; the response is the whole new state. */
async function update(body: Record<string, unknown>, action: 'category' | 'all' | null = null) {
  busy.value = true
  message.value = ''
  failed.value = false
  try {
    preferences.value = await $api<MailPreferences>(endpoint.value, { method: 'PUT', body })
    done.value = action
    if (!action) message.value = t('mail_preferences.saved')
  }
  catch (failure) {
    if (isInvalidLink(failure)) invalid.value = true
    message.value = localizeError(failure)
    failed.value = true
  }
  finally {
    busy.value = false
  }
}

const localized = (values?: Record<string, string>) => values?.[locale.value] ?? values?.en ?? ''
const category = computed(() => preferences.value?.category ?? null)
const categoryName = computed(() => localized(category.value?.names) || category.value?.key || '')
const categorySubscribed = computed(() => preferences.value?.mail_subscriptions.find(item => item.key === category.value?.key)?.is_subscribed ?? false)
const anyOptional = computed(() => preferences.value?.mail_subscriptions.some(item => !item.is_required && item.is_subscribed) ?? false)

const unsubscribeCategory = () => category.value && update({ subscriptions: { [category.value.key]: false } }, 'category')

useSeoMeta({ title: () => t('mail_preferences.title'), robots: 'noindex' })
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-primary/10 via-transparent to-primary/5 px-4 py-10 sm:py-16">
    <div class="mx-auto w-full max-w-xl">
      <div class="card p-6 sm:p-10">
        <div class="mb-8 text-center">
          <UiIconTile :icon="Settings" size="lg" class="mb-4" />
          <h1 class="text-2xl font-black text-title">{{ t('mail_preferences.title') }}</h1>
          <p v-if="preferences" class="mt-2 text-sm text-body">{{ t('mail_preferences.subtitle', { email: preferences.email }) }}</p>
        </div>

        <div v-if="invalid" class="text-center" role="alert">
          <div class="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-danger/10"><Link2Off :size="26" class="text-danger" /></div>
          <h2 class="text-lg font-bold text-title">{{ t('mail_preferences.invalid_title') }}</h2>
          <p class="mx-auto mt-2 max-w-sm text-sm text-body">{{ t('mail_preferences.invalid_message') }}</p>
          <UiButton to="/account?tab=notifications" variant="primary" class="mt-6">
            {{ t('mail_preferences.go_to_account') }}
          </UiButton>
        </div>

        <SkeletonStatus v-else-if="loading" class="space-y-4">
          <div class="skeleton h-11 w-full rounded-xl" />
          <div class="skeleton h-10 w-full max-w-sm rounded-lg" />
          <div v-for="row in 3" :key="row" class="flex items-start gap-4">
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3.5 w-1/3 rounded-full" />
              <div class="skeleton h-3 w-2/3 rounded-full" />
            </div>
            <div class="skeleton h-6 w-11 shrink-0 rounded-full" />
          </div>
        </SkeletonStatus>

        <CommonLoadError v-else-if="loadError" :message="loadError" @retry="load" />

        <template v-else-if="preferences">
          <p v-if="done" class="mb-6 flex items-start gap-2 rounded-xl border border-success/25 bg-success/10 p-4 text-sm text-success" role="status">
            <CheckCircle :size="18" class="mt-0.5 shrink-0" />
            <span>{{ done === 'category' ? t('mail_preferences.unsubscribed', { name: categoryName }) : t('mail_preferences.unsubscribed_all') }}</span>
          </p>

          <p v-if="category?.is_required" class="mb-6 flex items-start gap-2 rounded-xl border border-info/25 bg-info/10 p-4 text-sm text-info">
            <Info :size="18" class="mt-0.5 shrink-0" />
            <span>{{ t('mail_preferences.required_notice', { name: categoryName }) }}</span>
          </p>
          <UiButton
            v-else-if="category && categorySubscribed" variant="primary" size="lg" :icon="MailX" :disabled="busy" block
            class="mb-3"
            @click="unsubscribeCategory"
          >
            {{ t('mail_preferences.unsubscribe', { name: categoryName }) }}
          </UiButton>
          <UiButton
            v-if="anyOptional" variant="outline" size="lg" :disabled="busy" block
            class="mb-8"
            @click="update({ unsubscribe_all: true }, 'all')"
          >
            {{ t('mail_preferences.unsubscribe_all') }}
          </UiButton>

          <h2 class="mb-4 border-t border-line pt-6 text-sm font-semibold text-title">{{ t('mail_preferences.settings_title') }}</h2>
          <MailSettings
            :mail-locale="preferences.mail_locale" :subscriptions="preferences.mail_subscriptions" :busy="busy"
            @locale="code => update({ mail_locale: code })" @toggle="(key, subscribed) => update({ subscriptions: { [key]: subscribed } })"
          />
          <p v-if="message" class="mt-4 text-sm" :class="failed ? 'text-danger' : 'text-success'" role="status">{{ message }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
