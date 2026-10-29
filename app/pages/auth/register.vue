<template>
  <div class="flex w-full max-w-[24rem] flex-col gap-6 px-5 py-8 sm:py-12 lg:py-14">
    <!-- Registration paused by the site settings -->
    <UiAlert v-if="site?.registration_open === false" tone="warning" :title="t('auth.register.closed_title')">
      {{ t('auth.register.closed_message') }}
    </UiAlert>

    <template v-else>
      <AuthTracks :steps="stepNames" :current="current" :finished="step === 'done'" @go="go" />

      <Transition name="auth-step" mode="out-in">
        <div :key="step" class="flex flex-col gap-6">
          <AuthStepHead v-if="step !== 'done'" :step="step" :total="STEPS.length" :title="t(`auth.register.${STEPS[step - 1]}.title`)" :lead="t(`auth.register.${STEPS[step - 1]}.lead`)" />
          <!-- A danger UiAlert is role="alert", so it is read out -->
          <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

          <AuthRegisterStepNotice v-if="step === 1" @next="go(2)" />
          <AuthRegisterStepTerms v-else-if="step === 2" v-model="form.accepted" @prev="go(1)" @next="go(3)" />
          <AuthRegisterStepProfile
            v-else-if="step === 3"
            v-model:nickname="form.nickname"
            v-model:birthday="form.birthday"
            :errors="{ nickname: fieldErrors.nickname, birthday: fieldErrors.birthday }"
            @prev="go(2)"
            @next="go(4)"
          />
          <AuthRegisterStepPassword
            v-else-if="step === 4"
            v-model:password="form.password"
            v-model:confirm="form.confirm"
            :nickname="form.nickname"
            :birthday="form.birthday"
            :error="fieldErrors.password"
            @prev="go(3)"
            @next="go(5)"
          />
          <AuthRegisterStepEmail
            v-else-if="step === 5"
            v-model:email="form.email"
            v-model:code="form.code"
            :creating="creating"
            :errors="{ email: fieldErrors.email, code: fieldErrors.code }"
            @prev="go(4)"
            @create="create"
          />
          <AuthRegisterStepDone v-else />
        </div>
      </Transition>

      <p v-if="step !== 'done'" class="text-center text-[13px] text-meta">
        {{ t('auth.register.have_account') }}
        <NuxtLink to="/auth/login" class="link ml-1 font-semibold">{{ t('auth.register.login_now') }}</NuxtLink>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
type Step = 1 | 2 | 3 | 4 | 5 | 'done'
type Field = 'nickname' | 'birthday' | 'password' | 'email' | 'code'

// One per step and one per track on the stage's record, in order
const STEPS = ['notice', 'terms', 'profile', 'password', 'email'] as const
// Where the reader is sent back to when the server turns a field down
const FIELD_STEP: Record<Field, Step> = { nickname: 3, birthday: 3, password: 4, email: 5, code: 5 }
const API_FIELDS: Record<string, Field> = { nickname: 'nickname', birthday: 'birthday', password: 'password', email: 'email', verification_code: 'code' }
const CODE_FIELDS: Record<string, Field> = { UNDER_MINIMUM_AGE: 'birthday', EMAIL_ALREADY_REGISTERED: 'email', VERIFICATION_CODE_INVALID: 'code', VERIFICATION_CODE_EXPIRED: 'code' }

const { t, locale } = useI18n()
const { register } = useAuth()
const { site } = useSite()
const track = useAuthStageTrack()

// Kept in this page only: a reload starts again, and the password is never stored
const step = ref<Step>(1)
const current = computed(() => (step.value === 'done' ? STEPS.length : step.value))
const form = reactive({ accepted: false, nickname: '', birthday: '', password: '', confirm: '', email: '', code: '' })
const stepNames = computed(() => STEPS.map(key => t(`auth.register.steps.${key}`)))
const creating = ref(false)
const error = ref('')
const fieldErrors = reactive<Record<Field, string | null>>({ nickname: null, birthday: null, password: null, email: null, code: null })

// The stylus follows the steps; once the account exists the arm goes back to its rest
watchEffect(() => {
  track.value = step.value === 'done' ? null : step.value
})

function go(to: number) {
  if (step.value === 'done' || to < 1 || to > STEPS.length) return
  step.value = to as Step
  error.value = ''
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function create() {
  if (creating.value) return
  creating.value = true
  error.value = ''
  for (const field of Object.keys(fieldErrors) as Field[]) fieldErrors[field] = null

  const result = await register({
    nickname: form.nickname.trim(),
    email: form.email.trim(),
    password: form.password,
    verification_code: form.code,
    birthday: form.birthday,
    // Becomes the mail language; it can be changed later in the account settings
    locale: locale.value,
  })
  creating.value = false
  if (result.success) {
    step.value = 'done'
    return
  }

  // Put each problem on its field, then go back to the first step that has one
  const fields: Field[] = []
  const known = result.code ? CODE_FIELDS[result.code] : undefined
  if (known) {
    fieldErrors[known] = result.error ?? null
    fields.push(known)
  }
  for (const key of Object.keys(result.details ?? {})) {
    const field = API_FIELDS[key]
    if (!field) continue
    fieldErrors[field] ??= t('errors.invalid_field', { field: t(`auth.register.field_labels.${key}`) })
    fields.push(field)
  }
  if (!fields.length) {
    error.value = result.error || t('auth.register.register_failed')
    return
  }
  const first = Math.min(...fields.map(field => FIELD_STEP[field] as number))
  if (first !== step.value) step.value = first as Step
}

useHead({
  title: computed(() => t('user.register')),
  meta: [
    { name: 'robots', content: 'noindex' },
    { name: 'description', content: computed(() => t('auth.register.meta_description')) },
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
