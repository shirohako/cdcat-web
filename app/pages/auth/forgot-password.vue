<template>
  <div class="flex w-full max-w-[24rem] flex-col gap-6 px-5 py-8 sm:py-12 lg:py-14">
    <AuthTracks :steps="stepNames" :current="step" :finished="step === 3" @go="go" />

    <Transition name="auth-step" mode="out-in">
      <!-- Step 1: the address -->
      <div v-if="step === 1" key="email" class="flex flex-col gap-6">
        <AuthStepHead :step="1" :total="3" :title="t('auth.forgot_password.title')" :lead="t('auth.forgot_password.subtitle')" />
        <form class="flex flex-col gap-4" novalidate @submit.prevent="sendCode">
          <UiField id="email" :label="t('auth.forgot_password.email')">
            <template #default="{ id }">
              <UiInput :id="id" v-model="email" type="email" autocomplete="email" :placeholder="t('auth.forgot_password.email_placeholder')" class="h-11 w-full rounded-md" required />
            </template>
          </UiField>
          <AuthCodeStatus :sent-to="null" :minutes="null" :failure="failure" />
          <UiButton type="submit" variant="primary" size="lg" block class="rounded-md" :loading="sending" :disabled="!valid">
            {{ sending ? t('auth.forgot_password.sending') : t('auth.forgot_password.send_code') }}
          </UiButton>
        </form>
      </div>

      <!-- Step 2: the code and a new password -->
      <div v-else-if="step === 2" key="reset" class="flex flex-col gap-6">
        <AuthStepHead :step="2" :total="3" :title="t('auth.forgot_password.step2_title')" :lead="t('auth.forgot_password.step2_subtitle')" />
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3 rounded-md bg-sunken px-3 py-2.5 text-sm">
            <span class="flex min-w-0 items-center gap-2 text-title">
              <UiIcon icon="lucide:mail" class="size-4 shrink-0 text-meta" /><span class="truncate">{{ sentTo }}</span>
            </span>
            <UiButton size="xs" class="shrink-0 rounded-md" @click="go(1)">{{ t('auth.forgot_password.change_email') }}</UiButton>
          </div>
          <AuthCodeStatus :sent-to="sentTo" :minutes="minutes" :failure="failure" :sent-text="sentTo ? t('auth.forgot_password.sent', { email: maskEmail(sentTo) }) : undefined" />
        </div>
        <UiAlert v-if="resetError" tone="danger">{{ resetError }}</UiAlert>
        <form class="flex flex-col gap-5" novalidate @submit.prevent="resetPassword">
          <UiField id="verification-code" :label="t('auth.code.label')" :error="codeError">
            <template #default="{ id, invalid }">
              <div class="flex flex-col gap-2">
                <AuthCodeInput :id="id" v-model="code" :invalid="invalid" />
                <div>
                  <UiButton size="xs" icon="lucide:refresh-cw" class="rounded-md" :loading="sending" :disabled="countdown > 0" @click="sendCode">
                    {{ countdown > 0 ? t('auth.code.resend_in', { seconds: countdown }) : t('auth.code.resend') }}
                  </UiButton>
                </div>
              </div>
            </template>
          </UiField>
          <AuthPasswordFields v-model:password="password" v-model:confirm="confirm" :label="t('auth.password.new_label')" :error="passwordError" id-prefix="reset-password" />
          <UiButton type="submit" variant="primary" size="lg" block class="rounded-md" :loading="resetting" :disabled="!ready">
            {{ resetting ? t('auth.forgot_password.resetting') : t('auth.forgot_password.reset') }}
          </UiButton>
        </form>
      </div>

      <!-- Step 3: done -->
      <div v-else key="done" class="flex flex-col gap-6">
        <span class="grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <UiIcon icon="lucide:circle-check" class="size-8" />
        </span>
        <AuthStepHead :title="t('auth.forgot_password.success_title')" :lead="t('auth.forgot_password.success_message')" />
        <UiButton to="/auth/login" variant="primary" size="lg" icon="lucide:log-in" block class="rounded-md">{{ t('auth.forgot_password.back_to_login') }}</UiButton>
      </div>
    </Transition>

    <p v-if="step !== 3" class="text-center text-[13px] text-meta">
      <NuxtLink to="/auth/login" class="link font-semibold">{{ t('auth.forgot_password.back_to_login') }}</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { $api } = useNuxtApp()
const { sending, sentTo, minutes, countdown, failure, send } = useCodeRequest()
const { localizeError } = useLocalizedApiError()
// The login record, its stylus on the second track (A2, the reset)
useAuthStageTrack().value = 2

const step = ref<1 | 2 | 3>(1)
const stepNames = computed(() => (['email', 'reset', 'done'] as const).map(key => t(`auth.forgot_password.steps.${key}`)))
const email = ref('')
const code = ref('')
const password = ref('')
const confirm = ref('')
const resetting = ref(false)
const resetError = ref('')
const codeError = ref<string | null>(null)
const passwordError = ref<string | null>(null)

const valid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const ready = computed(() => code.value.length === 6 && password.value.length >= MIN_PASSWORD_LENGTH && password.value === confirm.value && !resetting.value)

function go(to: number) {
  if (step.value === 3 || to >= step.value) return
  step.value = to as 1 | 2
}

async function sendCode() {
  if (!valid.value) return
  const target = email.value.trim()
  // The API answers the same whether or not the address has an account
  const sent = await send(target, () => $api('/v1/auth/forgot-password', { method: 'POST', body: { email: target } }), 'auth.forgot_password.send_failed')
  if (sent) step.value = 2
}

async function resetPassword() {
  if (!ready.value || !sentTo.value) return
  resetting.value = true
  resetError.value = ''
  codeError.value = null
  passwordError.value = null
  try {
    await $api('/v1/auth/reset-password', {
      method: 'POST',
      body: { email: sentTo.value, verification_code: code.value, password: password.value, password_confirmation: confirm.value },
    })
    step.value = 3
  } catch (error) {
    const name = (error as { name?: string })?.name
    const fields = (error as { details?: { details?: Record<string, unknown> } })?.details?.details ?? {}
    const message = localizeError(error, 'auth.forgot_password.reset_failed')
    if (name === 'VERIFICATION_CODE_INVALID' || name === 'VERIFICATION_CODE_EXPIRED' || 'verification_code' in fields) codeError.value = message
    else if ('password' in fields) passwordError.value = t('errors.invalid_field', { field: t('auth.password.new_label') })
    else resetError.value = message
  } finally {
    resetting.value = false
  }
}

useHead({
  title: computed(() => t('auth.forgot_password.title')),
  meta: [
    { name: 'robots', content: 'noindex' },
    { name: 'description', content: computed(() => t('auth.forgot_password.subtitle')) },
  ],
})
</script>

<style scoped>
.auth-step-enter-active,
.auth-step-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.auth-step-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.auth-step-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .auth-step-enter-active,
  .auth-step-leave-active {
    transition: none;
  }
}
</style>
