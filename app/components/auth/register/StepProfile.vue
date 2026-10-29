<script setup lang="ts">
import { MIN_AGE } from '~/legal/constants'

/**
 * Sign-up step 3: a nickname, and a birthday that only checks the minimum age (the API checks it again). `errors`
 * are the server's, when the account couldn't be created and the reader was sent back here.
 */
const props = defineProps<{ errors?: { nickname?: string | null, birthday?: string | null } }>()
const nickname = defineModel<string>('nickname', { required: true })
const birthday = defineModel<string>('birthday', { required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
const { t } = useI18n()

const tried = ref(false)
const pad = (n: number) => String(n).padStart(2, '0')
const now = new Date()
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const tooYoung = computed(() => {
  if (!birthday.value) return false
  const limit = new Date()
  limit.setFullYear(limit.getFullYear() - MIN_AGE)
  return new Date(`${birthday.value}T00:00:00`) > limit
})
const nicknameError = computed(() => props.errors?.nickname || (tried.value && !nickname.value.trim() ? t('auth.register.profile.nickname_required') : null))
const birthdayError = computed(() => {
  if (props.errors?.birthday) return props.errors.birthday
  if (tooYoung.value) return t('auth.register.profile.under_age', { age: MIN_AGE })
  return tried.value && !birthday.value ? t('auth.register.profile.birthday_required') : null
})

function next() {
  tried.value = true
  if (nickname.value.trim() && birthday.value && !tooYoung.value) emit('next')
}
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="next">
    <UiField id="register-nickname" :label="t('auth.register.profile.nickname')" :hint="`${nickname.length} / 32`" :error="nicknameError">
      <template #default="{ id, describedBy, invalid }">
        <UiInput
          :id="id"
          v-model="nickname"
          maxlength="32"
          autocomplete="nickname"
          :placeholder="t('auth.register.profile.nickname_placeholder')"
          class="h-11 w-full rounded-md"
          :invalid="invalid"
          :aria-describedby="describedBy"
        />
      </template>
    </UiField>
    <UiField id="register-birthday" :label="t('auth.register.profile.birthday')" :hint="t('auth.register.profile.birthday_hint', { age: MIN_AGE })" :error="birthdayError">
      <template #default="{ id, describedBy, invalid }">
        <UiInput
          :id="id"
          v-model="birthday"
          type="date"
          min="1900-01-01"
          :max="today"
          autocomplete="bday"
          class="h-11 w-full rounded-md"
          :invalid="invalid"
          :aria-describedby="describedBy"
        />
      </template>
    </UiField>
    <div class="flex gap-2.5">
      <UiButton icon="lucide:arrow-left" class="rounded-md" @click="emit('prev')">{{ t('auth.register.prev') }}</UiButton>
      <UiButton type="submit" variant="primary" icon-right="lucide:arrow-right" class="flex-1 rounded-md">{{ t('auth.register.next') }}</UiButton>
    </div>
  </form>
</template>
