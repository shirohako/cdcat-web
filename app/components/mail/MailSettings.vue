<script setup lang="ts">
import { Lock } from '@lucide/vue'
import type { MailSubscription } from '~/types/mail'
import type { UiSelectOption } from '~/components/ui/Select.vue'

/**
 * The mail language and one switch per category. The parent saves each change and passes the
 * result back in: the account settings tab, and the settings page behind the link in group mail.
 */
defineProps<{
  mailLocale: string
  subscriptions: MailSubscription[]
  busy?: boolean
}>()
const emit = defineEmits<{
  locale: [code: string]
  toggle: [key: string, subscribed: boolean]
}>()

const { t, locale, locales } = useI18n()
// Each language in its own name, as in the language menu.
const languages = computed(() => locales.value.map(item => typeof item === 'string' ? { code: item, name: item } : { code: item.code, name: item.name ?? item.code }))
const localized = (values?: Record<string, string>) => values?.[locale.value] ?? values?.en ?? ''

// The select keeps showing the saved language until the parent confirms the new one: it is bound one way
// (with an update listener, so UiSelect doesn't keep the pick locally) and picking only asks the parent.
const languageOptions = computed<UiSelectOption<string>[]>(() => languages.value.map(language => ({ value: language.code, label: language.name })))
const changeLocale = (code?: string) => {
  if (code) emit('locale', code)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid max-w-sm gap-1.5">
      <label for="mail-locale" class="text-sm font-medium text-body">{{ t('mail_settings.language') }}</label>
      <UiSelect id="mail-locale" :model-value="mailLocale" :options="languageOptions" :disabled="busy" class="w-full" @update:model-value="changeLocale" />
      <p class="text-xs text-meta">{{ t('mail_settings.language_help') }}</p>
    </div>

    <ul class="divide-y divide-line">
      <li v-for="item in subscriptions" :key="item.key" class="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-title">
            {{ localized(item.names) || item.key }}
            <span v-if="item.is_required" class="ml-1.5 inline-flex items-center gap-1 rounded bg-btn px-1.5 py-0.5 align-middle text-[11px] font-medium text-btn-content">
              <Lock :size="10" />{{ t('mail_settings.required') }}
            </span>
          </p>
          <p v-if="localized(item.descriptions)" class="mt-0.5 text-xs text-meta">{{ localized(item.descriptions) }}</p>
        </div>
        <button
          type="button" role="switch" :aria-checked="item.is_subscribed" :aria-label="t('mail_settings.receive', { name: localized(item.names) || item.key })"
          :disabled="busy || item.is_required" :title="item.is_required ? t('mail_settings.required_help') : undefined"
          class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50" :class="item.is_subscribed ? 'bg-primary' : 'bg-faint'"
          @click="emit('toggle', item.key, !item.is_subscribed)"
        >
          <span class="absolute top-0.5 size-5 rounded-full transition" :class="item.is_subscribed ? 'left-5.5 bg-on-primary' : 'left-0.5 bg-on-media'" />
        </button>
      </li>
    </ul>
  </div>
</template>
