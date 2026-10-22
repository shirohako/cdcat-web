<script setup lang="ts">
import type { AdminMailContents, AdminMailLocale, AdminMailTarget, AdminMailTestResult } from '~/types/admin'

/**
 * Sends the text as it stands, saved or not, to the operator's own address: one mail per chosen
 * language, through the mailer the real mail would use (POST /v1/admin/mail/test).
 */
const props = withDefaults(defineProps<{ target: AdminMailTarget | null, contents: AdminMailContents, disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ errors: [errors: Record<string, string[]>] }>()

const { $api } = useNuxtApp()
const { user } = useAuth()
const { t, localeName, mailError, fieldErrors } = useAdminMail()
const available = computed(() => filledMailLocales(props.contents))
const chosen = ref<AdminMailLocale[]>([])
watch(available, (locales) => {
  chosen.value = chosen.value.filter(locale => locales.includes(locale))
  if (!chosen.value.length && locales.length) chosen.value = [locales[0]!]
}, { immediate: true })
const toggle = (locale: AdminMailLocale) => {
  chosen.value = chosen.value.includes(locale) ? chosen.value.filter(item => item !== locale) : [...chosen.value, locale]
}

const busy = ref(false)
const results = ref<AdminMailTestResult[]>([])
const message = ref('')
const send = async () => {
  if (!props.target || !chosen.value.length || busy.value) return
  busy.value = true
  message.value = ''
  results.value = []
  try {
    const response = await $api<{ results: AdminMailTestResult[] }>('/v1/admin/mail/test', {
      method: 'POST', body: { ...props.target, contents: props.contents, locales: chosen.value },
    })
    results.value = response.results
    emit('errors', {})
  } catch (failure) {
    message.value = mailError(failure)
    emit('errors', fieldErrors(failure))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
    <h3 class="font-medium">{{ t('admin_pages.mail.test.title') }}</h3>
    <p class="mt-1 text-xs text-slate-500">{{ t('admin_pages.mail.test.help', { email: user?.email ?? '' }) }}</p>
    <p v-if="!available.length" class="mt-3 text-xs text-slate-500">{{ t('admin_pages.mail.test.nothing') }}</p>
    <div v-else class="mt-3 flex flex-wrap items-center gap-3">
      <label v-for="locale in available" :key="locale" class="flex items-center gap-1.5">
        <input type="checkbox" :checked="chosen.includes(locale)" :disabled="busy || disabled" @change="toggle(locale)">{{ localeName(locale) }}
      </label>
      <button type="button" :disabled="busy || disabled || !target || !chosen.length" class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40" @click="send">
        {{ busy ? t('admin_pages.mail.test.sending') : t('admin_pages.mail.test.send') }}
      </button>
    </div>
    <p v-if="message" role="alert" class="mt-3 text-xs text-red-700">{{ message }}</p>
    <ul v-if="results.length" class="mt-3 space-y-1 text-xs" role="status">
      <li v-for="result in results" :key="result.locale" :class="result.status === 'sent' ? 'text-emerald-700' : 'text-red-700'">
        {{ localeName(result.locale) }}：{{ result.status === 'sent' ? t('admin_pages.mail.test.sent') : t('admin_pages.mail.test.failed', { error: result.error ?? '' }) }}
      </li>
    </ul>
  </section>
</template>
