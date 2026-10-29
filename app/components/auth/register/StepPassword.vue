<script setup lang="ts">
/** Sign-up step 4: the password, twice (see PasswordFields). Weak ones get hints; only a short one or a mismatch holds the reader here. */
defineProps<{ nickname: string, birthday: string, error?: string | null }>()
const password = defineModel<string>('password', { required: true })
const confirm = defineModel<string>('confirm', { required: true })
const emit = defineEmits<{ next: [], prev: [] }>()

const ready = computed(() => password.value.length >= MIN_PASSWORD_LENGTH && password.value === confirm.value)
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="ready && emit('next')">
    <AuthPasswordFields v-model:password="password" v-model:confirm="confirm" :nickname="nickname" :birthday="birthday" :error="error" id-prefix="register-password" />
    <div class="flex gap-2.5">
      <UiButton icon="lucide:arrow-left" class="rounded-md" @click="emit('prev')">{{ $t('auth.register.prev') }}</UiButton>
      <UiButton type="submit" variant="primary" icon-right="lucide:arrow-right" class="flex-1 rounded-md" :disabled="!ready">{{ $t('auth.register.next') }}</UiButton>
    </div>
  </form>
</template>
