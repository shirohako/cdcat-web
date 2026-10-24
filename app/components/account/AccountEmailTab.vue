<template>
  <div class="space-y-6">
    <section class="card overflow-hidden">
      <div class="p-6 pb-5 border-b border-line">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.email.title') }}</h2>
        <p class="text-sm text-meta mt-1">{{ t('account_pages.email.description') }}</p>
      </div>

      <div class="p-6 space-y-6">
        <!-- Current email with action button -->
        <div
          class="flex items-center justify-between gap-4 p-4 rounded-xl border"
          :class="user?.email ? 'bg-success/10 border-success/25' : 'bg-sunken border-line'"
        >
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="user?.email ? 'bg-success/15' : 'bg-card ring-1 ring-line'"
            >
              <Mail :size="18" :class="user?.email ? 'text-success' : 'text-meta'" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-title truncate">
                {{ user?.email || t('account_pages.email.not_linked') }}
              </p>
              <p
                v-if="user?.email"
                class="text-xs text-success font-medium flex items-center gap-1 mt-0.5"
              >
                <ShieldCheck :size="12" />
                {{ t('account_pages.email.verified') }}
              </p>
              <p v-else class="text-xs text-meta mt-0.5">
                {{ t('account_pages.email.link_hint') }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-150 ease-out text-xs font-medium whitespace-nowrap"
            @click="editing = true"
          >
            {{ user?.email ? t('account_pages.email.change') : t('account_pages.email.link') }}
          </button>
        </div>

        <!-- Edit form -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="editing" class="grid gap-5 max-w-sm">
            <!-- Error message -->
            <div v-if="errorMessage" class="bg-danger/10 border border-danger/25 rounded-lg p-3">
              <p class="text-sm text-danger">{{ errorMessage }}</p>
            </div>

            <!-- New email -->
            <div class="grid gap-1.5">
              <label for="new-email" class="text-sm font-medium text-body">
                {{ user?.email ? t('account_pages.email.new_address') : t('account_pages.email.address') }}
              </label>
              <input
                id="new-email"
                v-model="form.newEmail"
                type="email"
                class="input w-full"
                placeholder="your@email.com"
              />
              <p class="text-xs text-meta">{{ t('account_pages.email.invalid') }}</p>
            </div>

            <!-- Verification code -->
            <div class="grid gap-1.5">
              <label for="email-code" class="text-sm font-medium text-body">{{ t('account_pages.email.verification_code') }}</label>
              <div class="flex gap-2">
                <input
                  id="email-code"
                  v-model="form.verificationCode"
                  type="text"
                  maxlength="6"
                  class="input flex-1"
                  :placeholder="t('account_pages.email.code_placeholder')"
                  @keyup.enter="submit"
                />
                <button
                  type="button"
                  :disabled="!form.newEmail || countdown > 0 || isSendingCode"
                  class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="countdown > 0 ? 'bg-sunken text-meta border-line' : 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/20'"
                  @click="sendCode"
                >
                  <span v-if="isSendingCode" class="loading loading-spinner loading-xs"></span>
                  <span v-else>{{ countdown > 0 ? `${countdown}s` : t('account_pages.email.send_code') }}</span>
                </button>
              </div>
              <p class="text-xs text-meta">{{ t('account_pages.email.code_hint') }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <div
        v-if="editing"
        class="px-6 py-4 bg-sunken border-t border-line flex justify-end gap-2"
      >
        <button type="button" class="btn btn-ghost btn-sm" @click="cancelEdit">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          :disabled="!canSubmit || isSubmitting"
          @click="submit"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
          <template v-else>
            <Mail :size="14" />
            {{ t('account_pages.email.confirm_change') }}
          </template>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Mail, ShieldCheck } from '@lucide/vue'

defineProps({
  user: { type: Object, default: null }
})

const emit = defineEmits(['save', 'error'])

const { $api } = useNuxtApp()
const { fetchUser } = useAuth()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

const editing = ref(false)
const errorMessage = ref('')
const isSendingCode = ref(false)
const isSubmitting = ref(false)
const countdown = ref(0)
let countdownTimer = null

const form = reactive({
  newEmail: '',
  verificationCode: ''
})

const canSubmit = computed(() => {
  return form.newEmail && form.verificationCode
})

const resetForm = () => {
  form.newEmail = ''
  form.verificationCode = ''
  errorMessage.value = ''
  countdown.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const cancelEdit = () => {
  resetForm()
  editing.value = false
}

const sendCode = async () => {
  if (!form.newEmail || countdown.value > 0 || isSendingCode.value) return

  isSendingCode.value = true
  errorMessage.value = ''

  try {
    await $api('/v1/me/email/send-code', {
      method: 'POST',
      body: { email: form.newEmail }
    })

    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    errorMessage.value = localizeError(error, 'account_pages.email.send_failed')
  } finally {
    isSendingCode.value = false
  }
}

const submit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $api('/v1/me/email', {
      method: 'PUT',
      body: {
        email: form.newEmail,
        verification_code: form.verificationCode
      }
    })

    await fetchUser()
    emit('save', t('account_pages.email.change_success'))
    resetForm()
    editing.value = false
  } catch (error) {
    errorMessage.value = localizeError(error, 'account_pages.email.change_failed')
  } finally {
    isSubmitting.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>
