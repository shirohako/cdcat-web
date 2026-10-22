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
  <div class="min-h-screen bg-linear-to-br from-sky-50 via-slate-50 to-emerald-50 px-4 py-10 sm:py-16">
    <div class="mx-auto w-full max-w-xl">
      <div class="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] sm:p-10">
        <div class="mb-8 text-center">
          <div class="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 text-white shadow-lg">
            <Settings :size="24" />
          </div>
          <h1 class="text-2xl font-black text-slate-900">{{ t('mail_preferences.title') }}</h1>
          <p v-if="preferences" class="mt-2 text-sm text-slate-600">{{ t('mail_preferences.subtitle', { email: preferences.email }) }}</p>
        </div>

        <div v-if="invalid" class="text-center" role="alert">
          <div class="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-rose-50"><Link2Off :size="26" class="text-rose-500" /></div>
          <h2 class="text-lg font-bold text-slate-900">{{ t('mail_preferences.invalid_title') }}</h2>
          <p class="mx-auto mt-2 max-w-sm text-sm text-slate-600">{{ t('mail_preferences.invalid_message') }}</p>
          <NuxtLink to="/account?tab=notifications" class="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            {{ t('mail_preferences.go_to_account') }}
          </NuxtLink>
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
          <p v-if="done" class="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
            <CheckCircle :size="18" class="mt-0.5 shrink-0" />
            <span>{{ done === 'category' ? t('mail_preferences.unsubscribed', { name: categoryName }) : t('mail_preferences.unsubscribed_all') }}</span>
          </p>

          <p v-if="category?.is_required" class="mb-6 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <Info :size="18" class="mt-0.5 shrink-0" />
            <span>{{ t('mail_preferences.required_notice', { name: categoryName }) }}</span>
          </p>
          <button
            v-else-if="category && categorySubscribed" type="button" :disabled="busy"
            class="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            @click="unsubscribeCategory"
          >
            <MailX :size="18" />{{ t('mail_preferences.unsubscribe', { name: categoryName }) }}
          </button>
          <button
            v-if="anyOptional" type="button" :disabled="busy"
            class="mb-8 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            @click="update({ unsubscribe_all: true }, 'all')"
          >
            {{ t('mail_preferences.unsubscribe_all') }}
          </button>

          <h2 class="mb-4 border-t border-slate-100 pt-6 text-sm font-semibold text-slate-900">{{ t('mail_preferences.settings_title') }}</h2>
          <MailSettings
            :mail-locale="preferences.mail_locale" :subscriptions="preferences.mail_subscriptions" :busy="busy"
            @locale="code => update({ mail_locale: code })" @toggle="(key, subscribed) => update({ subscriptions: { [key]: subscribed } })"
          />
          <p v-if="message" class="mt-4 text-sm" :class="failed ? 'text-rose-600' : 'text-emerald-600'" role="status">{{ message }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
