<script setup lang="ts">
import { checkPassword, generatePassword, loadCommonPasswords, MIN_PASSWORD_LENGTH, type PasswordWarning } from '~/utils/password'

/**
 * A new password and its confirmation, for sign-up and reset. While it is typed there is a strength meter and hints:
 * a common password, a run like 1234, a repeat, the nickname or birthday, a year, the site's name. Hints never stop
 * anyone; the only rule is MIN_PASSWORD_LENGTH, which the API checks too. 随机生成 fills both fields with 16 random
 * characters and shows them, with a copy button. The common-password list is fetched once, when this first appears.
 */
const props = withDefaults(defineProps<{
  label?: string
  nickname?: string
  birthday?: string
  /** a server error about the password */
  error?: string | null
  idPrefix?: string
}>(), { label: undefined, nickname: undefined, birthday: undefined, error: undefined, idPrefix: 'password' })

const password = defineModel<string>('password', { required: true })
const confirm = defineModel<string>('confirm', { required: true })

const { t } = useI18n()
const { showToast } = useToast()

const common = shallowRef<ReadonlySet<string>>()
onMounted(async () => {
  common.value = await loadCommonPasswords()
})

const visible = ref(false)
const generated = ref(false)
const check = computed(() => checkPassword(password.value, { nickname: props.nickname, birthday: props.birthday, common: common.value }))
const bars = computed(() => (password.value ? [1, 1, 2, 3, 4][check.value.score]! : 0))
const tone = computed(() => (check.value.score <= 1 ? 'danger' : check.value.score === 2 ? 'warning' : 'success'))
const personal = computed(() => check.value.warnings.some(w => w === 'nickname' || w === 'birthday'))
const mismatch = computed(() => confirm.value.length > 0 && confirm.value !== password.value)
const matched = computed(() => confirm.value.length > 0 && confirm.value === password.value)

// Editing a generated password makes it the reader's own again
watch(password, (value) => {
  if (generated.value && value !== confirm.value) generated.value = false
})

function generate() {
  const value = generatePassword()
  password.value = value
  confirm.value = value
  visible.value = true
  generated.value = true
}

async function copy() {
  try {
    await navigator.clipboard.writeText(password.value)
    showToast(t('auth.password.copied'))
  } catch {
    showToast(t('auth.password.copy_failed'), 'error')
  }
}

const warningIcon = (warning: PasswordWarning) => (warning === 'common' ? 'lucide:x' : 'lucide:triangle-alert')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <UiField :id="`${idPrefix}-new`" :label="label ?? t('auth.password.label')" :error="error">
        <template #default="{ id, describedBy, invalid }">
          <div class="relative">
            <UiInput
              :id="id"
              v-model="password"
              :type="visible ? 'text' : 'password'"
              autocomplete="new-password"
              :placeholder="t('auth.password.placeholder', { n: MIN_PASSWORD_LENGTH })"
              class="h-11 w-full rounded-md pr-11"
              :class="{ 'font-mono tracking-wide': visible && generated }"
              :invalid="invalid"
              :aria-describedby="[describedBy, `${idPrefix}-hints`].filter(Boolean).join(' ')"
            />
            <button
              type="button"
              class="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-meta transition-colors hover:text-title"
              :aria-label="visible ? t('auth.password.hide') : t('auth.password.show')"
              :aria-pressed="visible"
              @click="visible = !visible"
            >
              <UiIcon :icon="visible ? 'lucide:eye-off' : 'lucide:eye'" class="size-[18px]" />
            </button>
          </div>
        </template>
      </UiField>
      <div :id="`${idPrefix}-hints`" class="flex flex-col gap-2">
        <div class="flex gap-1.5" aria-hidden="true">
          <i
            v-for="n in 4"
            :key="n"
            class="h-1 flex-1 rounded-full transition-colors duration-300"
            :class="n <= bars ? { danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success' }[tone] : 'bg-line'"
          />
        </div>
        <p class="flex justify-between text-xs text-meta">
          <span>{{ t('auth.password.strength') }}<b v-if="password" :class="{ danger: 'text-danger', warning: 'text-warning', success: 'text-success' }[tone]">{{ t(`auth.password.levels.${check.score}`) }}</b></span>
          <span class="tabular-nums">{{ t('auth.password.length', { n: password.length }) }}</span>
        </p>
        <ul v-if="password" class="flex flex-col gap-1 text-[13px]" aria-live="polite">
          <li v-for="warning in check.warnings" :key="warning" class="flex items-center gap-2" :class="warning === 'common' ? 'text-danger' : 'text-warning'">
            <UiIcon :icon="warningIcon(warning)" class="size-[15px] shrink-0" />{{ t(`auth.password.warnings.${warning}`) }}
          </li>
          <li class="flex items-center gap-2" :class="check.longEnough ? 'text-meta' : 'text-danger'">
            <UiIcon :icon="check.longEnough ? 'lucide:check' : 'lucide:x'" class="size-[15px] shrink-0" :class="{ 'text-success': check.longEnough }" />{{ t('auth.password.min_length', { n: MIN_PASSWORD_LENGTH }) }}
          </li>
          <li v-if="common?.size && !check.warnings.includes('common')" class="flex items-center gap-2 text-meta">
            <UiIcon icon="lucide:check" class="size-[15px] shrink-0 text-success" />{{ t('auth.password.not_common') }}
          </li>
          <li v-if="(nickname || birthday) && !personal" class="flex items-center gap-2 text-meta">
            <UiIcon icon="lucide:check" class="size-[15px] shrink-0 text-success" />{{ t('auth.password.not_personal') }}
          </li>
        </ul>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <UiButton size="sm" icon="lucide:dices" class="rounded-md" @click="generate">{{ generated ? t('auth.password.regenerate') : t('auth.password.generate') }}</UiButton>
      <UiButton v-if="generated" size="sm" icon="lucide:copy" class="rounded-md" @click="copy">{{ t('auth.password.copy') }}</UiButton>
      <span class="text-xs text-meta">{{ generated ? t('auth.password.generated') : t('auth.password.generate_hint') }}</span>
    </div>
    <UiField :id="`${idPrefix}-confirm`" :label="t('auth.password.confirm')" :error="mismatch ? t('auth.password.mismatch') : null">
      <template #default="{ id, describedBy, invalid }">
        <div class="relative">
          <UiInput
            :id="id"
            v-model="confirm"
            :type="visible ? 'text' : 'password'"
            autocomplete="new-password"
            :placeholder="t('auth.password.confirm_placeholder')"
            class="h-11 w-full rounded-md pr-11"
            :class="{ 'font-mono tracking-wide': visible && generated }"
            :invalid="invalid"
            :aria-describedby="describedBy"
          />
          <span v-if="matched" class="absolute right-3 top-1/2 -translate-y-1/2 text-success" :title="t('auth.password.match')">
            <UiIcon icon="lucide:check" class="size-[18px]" />
          </span>
        </div>
      </template>
    </UiField>
  </div>
</template>
