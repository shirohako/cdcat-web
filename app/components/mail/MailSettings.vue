<script setup lang="ts">
import { Lock } from '@lucide/vue'
import type { MailSubscription } from '~/types/mail'

/**
 * The mail language and one switch per category. The parent saves each change and passes the
 * result back in: the account settings tab, and the settings page behind the link in group mail.
 */
const props = defineProps<{
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

// The select keeps showing the saved language until the parent confirms the new one.
function changeLocale(event: Event) {
  const select = event.target as HTMLSelectElement
  const code = select.value
  select.value = props.mailLocale
  emit('locale', code)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid max-w-sm gap-1.5">
      <label for="mail-locale" class="text-sm font-medium text-gray-700">{{ t('mail_settings.language') }}</label>
      <select id="mail-locale" :value="mailLocale" :disabled="busy" class="select select-bordered w-full bg-white" @change="changeLocale">
        <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.name }}</option>
      </select>
      <p class="text-xs text-gray-400">{{ t('mail_settings.language_help') }}</p>
    </div>

    <ul class="divide-y divide-gray-100">
      <li v-for="item in subscriptions" :key="item.key" class="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900">
            {{ localized(item.names) || item.key }}
            <span v-if="item.is_required" class="ml-1.5 inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 align-middle text-[11px] font-medium text-gray-500">
              <Lock :size="10" />{{ t('mail_settings.required') }}
            </span>
          </p>
          <p v-if="localized(item.descriptions)" class="mt-0.5 text-xs text-gray-500">{{ localized(item.descriptions) }}</p>
        </div>
        <button
          type="button" role="switch" :aria-checked="item.is_subscribed" :aria-label="t('mail_settings.receive', { name: localized(item.names) || item.key })"
          :disabled="busy || item.is_required" :title="item.is_required ? t('mail_settings.required_help') : undefined"
          class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50" :class="item.is_subscribed ? 'bg-blue-600' : 'bg-gray-300'"
          @click="emit('toggle', item.key, !item.is_subscribed)"
        >
          <span class="absolute top-0.5 size-5 rounded-full bg-white shadow transition" :class="item.is_subscribed ? 'left-5.5' : 'left-0.5'" />
        </button>
      </li>
    </ul>
  </div>
</template>
