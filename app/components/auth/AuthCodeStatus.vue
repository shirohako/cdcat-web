<script setup lang="ts">
import { CONTACT_EMAIL } from '~/legal/constants'

/**
 * What came of asking for a mail code (useCodeRequest), shown under the email field rather than at the top of the
 * page: where it went and for how long, or why it didn't go. `sentText` replaces the sent line, for password reset,
 * which must not say whether the address has an account.
 */
defineProps<{
  sentTo: string | null
  minutes: number | null
  failure: { code: string | null, message: string } | null
  sentText?: string
}>()

const { t } = useI18n()
</script>

<template>
  <UiAlert v-if="failure?.code === 'EMAIL_ALREADY_REGISTERED'" tone="warning" :title="t('auth.code.registered_title')">
    {{ t('auth.code.registered') }}
    <template #actions>
      <UiButton to="/auth/login" size="sm" class="rounded-md">{{ t('auth.code.go_login') }}</UiButton>
      <UiButton to="/auth/forgot-password" size="sm" class="rounded-md">{{ t('auth.code.forgot') }}</UiButton>
    </template>
  </UiAlert>
  <UiAlert v-else-if="failure?.code === 'MAIL_SEND_FAILED'" tone="danger" :title="t('auth.code.failed_title')">
    {{ t('auth.code.failed', { email: CONTACT_EMAIL }) }}
  </UiAlert>
  <UiAlert v-else-if="failure" tone="danger">{{ failure.message }}</UiAlert>
  <UiAlert v-else-if="sentTo" tone="success">
    {{ sentText ?? (minutes ? t('auth.code.sent', { email: maskEmail(sentTo), minutes }) : t('auth.code.sent_plain', { email: maskEmail(sentTo) })) }}
  </UiAlert>
</template>
