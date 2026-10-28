<template>
  <div class="space-y-6">
    <!-- Change Password -->
    <section class="card overflow-hidden">
      <div class="p-6 pb-5 border-b border-line">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.security.title') }}</h2>
        <p class="text-sm text-meta mt-1">{{ t('account_pages.security.description') }}</p>
      </div>

      <!-- Collapsed: trigger button -->
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="!editing" class="p-6">
          <button
            type="button"
            class="group flex items-center gap-3 w-full p-4 rounded-xl bg-sunken hover:bg-card-hover active:bg-card-active transition-colors duration-150 ease-out text-left cursor-pointer"
            @click="editing = true"
          >
            <div class="w-10 h-10 rounded-full bg-card ring-1 ring-line flex items-center justify-center shrink-0">
              <KeyRound :size="18" class="text-meta group-hover:text-primary transition-colors" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-body group-hover:text-title transition-colors">{{ t('account_pages.security.open') }}</p>
            </div>
            <ChevronRight :size="16" class="text-faint group-hover:text-meta transition-colors shrink-0" />
          </button>
        </div>

        <!-- Expanded: password form -->
        <div v-else>
          <div class="p-6">
            <div class="grid gap-5 max-w-sm">
            <div class="grid gap-1.5">
              <label for="current-password" class="text-sm font-medium text-body">{{ t('account_pages.security.current') }}</label>
              <input
                id="current-password"
                v-model="passwordForm.currentPassword"
                type="password"
                class="input w-full"
                :placeholder="t('account_pages.security.current_placeholder')"
                @keyup.enter="submitPassword"
              >
              <p class="text-xs text-meta">{{ t('account_pages.security.current_hint') }}</p>
            </div>

            <div class="grid gap-1.5">
              <label for="new-password" class="text-sm font-medium text-body">{{ t('account_pages.security.new') }}</label>
              <input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                class="input w-full"
                :placeholder="t('account_pages.security.new_placeholder')"
                @keyup.enter="submitPassword"
              >
              <div v-if="passwordForm.newPassword" class="space-y-1.5 mt-0.5">
                <div class="flex gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="i <= strength.level ? strength.barColor : 'bg-line'"
                  />
                </div>
                <p class="text-xs font-medium" :class="strength.textColor">{{ strength.label }}</p>
              </div>
            </div>

            <div class="grid gap-1.5">
              <label for="confirm-password" class="text-sm font-medium text-body">{{ t('account_pages.security.confirm') }}</label>
              <input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input w-full"
                :placeholder="t('account_pages.security.confirm_placeholder')"
                @keyup.enter="submitPassword"
              >
              <p
                v-if="passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword"
                class="text-xs text-danger"
              >
                {{ t('account_pages.security.mismatch') }}
              </p>
              <p v-else class="text-xs text-meta">
                {{ t('account_pages.security.confirm_hint') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="px-6 pb-0">
          <div class="bg-danger/10 border border-danger/25 rounded-lg p-3">
            <p class="text-sm text-danger">{{ errorMessage }}</p>
          </div>
        </div>

        <div class="px-6 py-4 bg-sunken border-t border-line flex justify-end gap-2">
          <UiButton size="sm" @click="cancelEdit">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton variant="primary" size="sm" :icon="Lock" :loading="isSubmitting" @click="submitPassword">
            {{ t('account_pages.security.update') }}
          </UiButton>
        </div>
        </div>
      </Transition>
    </section>

  </div>
</template>

<script setup>
import { Lock, KeyRound, ChevronRight } from '@lucide/vue'

const { $api } = useNuxtApp()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

const emit = defineEmits(['save', 'error'])

const editing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const resetForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  errorMessage.value = ''
}

const cancelEdit = () => {
  resetForm()
  editing.value = false
}

const strength = computed(() => {
  const p = passwordForm.newPassword
  if (!p) return { level: 0, label: '', barColor: '', textColor: '' }

  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const map = {
    // The same status colours as the register page.
    0: { label: t('auth.register.strength_weak'), barColor: 'bg-danger', textColor: 'text-danger' },
    1: { label: t('auth.register.strength_fair'), barColor: 'bg-danger', textColor: 'text-danger' },
    2: { label: t('auth.register.strength_medium'), barColor: 'bg-warning', textColor: 'text-warning' },
    3: { label: t('auth.register.strength_strong'), barColor: 'bg-success', textColor: 'text-success' },
    4: { label: t('auth.register.strength_very_strong'), barColor: 'bg-success', textColor: 'text-success font-semibold' }
  }

  return { level: score, ...map[score] }
})

const submitPassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    errorMessage.value = t('account_pages.security.required')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errorMessage.value = t('account_pages.security.mismatch')
    return
  }
  if (passwordForm.newPassword.length < 8) {
    errorMessage.value = t('account_pages.security.too_short')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $api('/v1/me/password', {
      method: 'PUT',
      body: {
        current_password: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        password_confirmation: passwordForm.confirmPassword
      }
    })

    emit('save', t('account_pages.security.updated'))
    resetForm()
    editing.value = false
  } catch (error) {
    errorMessage.value = localizeError(error, 'account_pages.security.update_failed')
  } finally {
    isSubmitting.value = false
  }
}
</script>
