<script setup lang="ts">
/**
 * Sign-up step 5: the email address, the code mailed to it, and creating the account. What came of sending the code
 * shows right under the address. `errors` are the server's when creating the account failed on the address or code.
 */
const props = defineProps<{ creating: boolean, errors?: { email?: string | null, code?: string | null } }>()
const email = defineModel<string>('email', { required: true })
const code = defineModel<string>('code', { required: true })
const emit = defineEmits<{ create: [], prev: [] }>()

const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const { sending, sentTo, minutes, countdown, failure, send, reset } = useCodeRequest()
const codeInput = ref<{ focus: () => void }>()

const address = computed(() => email.value.trim())
const valid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.value))
const ready = computed(() => valid.value && code.value.length === 6 && !props.creating)
const sendLabel = computed(() => {
  if (sending.value) return t('auth.code.sending')
  if (countdown.value > 0) return t('auth.code.resend_in', { seconds: countdown.value })
  return sentTo.value ? t('auth.code.resend') : t('auth.code.send')
})

// A code belongs to the address it went to
watch(address, (value) => {
  if (sentTo.value && value !== sentTo.value) reset()
})

async function sendCode() {
  if (!valid.value) return
  const target = address.value
  // The code mail goes out in the interface language
  const sent = await send(target, () => $api('/v1/auth/send-verification-code', { method: 'POST', body: { email: target, locale: locale.value } }), 'auth.register.send_code_failed')
  if (sent) nextTick(() => codeInput.value?.focus())
}
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="ready && emit('create')">
    <div class="flex flex-col gap-3">
      <UiField id="register-email" :label="t('auth.register.email.label')" :error="errors?.email">
        <template #default="{ id, describedBy, invalid }">
          <div class="flex gap-2">
            <UiInput
              :id="id"
              v-model="email"
              type="email"
              autocomplete="email"
              :placeholder="t('auth.register.email.placeholder')"
              class="h-11 min-w-0 flex-1 rounded-md"
              :invalid="invalid"
              :aria-describedby="describedBy"
              @keydown.enter.prevent="sendCode"
            />
            <UiButton class="h-11 shrink-0 rounded-md" :loading="sending" :disabled="!valid || countdown > 0" @click="sendCode">{{ sendLabel }}</UiButton>
          </div>
        </template>
      </UiField>
      <AuthCodeStatus :sent-to="sentTo" :minutes="minutes" :failure="failure" />
    </div>
    <UiField id="register-code" :label="t('auth.code.label')" :error="errors?.code">
      <template #default="{ id, invalid }">
        <AuthCodeInput :id="id" ref="codeInput" v-model="code" :invalid="invalid" />
      </template>
    </UiField>
    <UiButton type="submit" variant="primary" size="lg" block class="rounded-md" :loading="creating" :disabled="!ready && !creating">
      {{ creating ? t('auth.register.creating_account') : t('auth.register.create_account') }}
    </UiButton>
    <div>
      <UiButton size="sm" icon="lucide:arrow-left" class="rounded-md" @click="emit('prev')">{{ t('auth.register.prev') }}</UiButton>
    </div>
  </form>
</template>
