<script setup lang="ts">
import { LEGAL_DATES } from '~/legal/constants'

/**
 * Sign-up step 2: the two documents and the box to agree to them, nothing more. The documents open in a new tab, so
 * reading them doesn't lose what has been filled in.
 */
const accepted = defineModel<boolean>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

const DOCUMENTS = [
  { key: 'terms', to: '/terms', icon: 'lucide:file-text' },
  { key: 'privacy', to: '/privacy', icon: 'lucide:shield-check' },
] as const
// The dates are calendar days; read them as local midnight so no time zone moves them
const updated = (key: 'terms' | 'privacy') => formatDate(new Date(`${LEGAL_DATES[key].updated}T00:00:00`))
</script>

<template>
  <div class="flex flex-col gap-5">
    <ul class="divide-y divide-line border-y border-line">
      <li v-for="doc in DOCUMENTS" :key="doc.key">
        <NuxtLink :to="doc.to" target="_blank" class="group flex items-center gap-3 px-1 py-3.5 text-sm">
          <UiIcon :icon="doc.icon" class="size-[18px] shrink-0 text-meta" />
          <span class="flex-1 font-bold text-title">{{ t(`auth.register.terms.${doc.key}`) }}</span>
          <span class="text-xs text-meta">{{ t('auth.register.terms.updated', { date: updated(doc.key) }) }}</span>
          <span class="inline-flex items-center gap-1 text-[13px] font-semibold text-body transition-colors group-hover:text-title">
            {{ t('auth.register.terms.read') }}<UiIcon icon="lucide:external-link" class="size-3.5" />
          </span>
        </NuxtLink>
      </li>
    </ul>
    <UiFlipCheckbox v-model="accepted">
      <i18n-t keypath="auth.register.terms.agree" tag="span" scope="global">
        <template #terms>
          <NuxtLink to="/terms" target="_blank" class="link font-semibold">{{ t('auth.register.terms.terms') }}</NuxtLink>
        </template>
        <template #privacy>
          <NuxtLink to="/privacy" target="_blank" class="link font-semibold">{{ t('auth.register.terms.privacy') }}</NuxtLink>
        </template>
      </i18n-t>
    </UiFlipCheckbox>
    <div class="flex gap-2.5">
      <UiButton icon="lucide:arrow-left" class="rounded-md" @click="emit('prev')">{{ t('auth.register.prev') }}</UiButton>
      <UiButton variant="primary" icon-right="lucide:arrow-right" class="flex-1 rounded-md" :disabled="!accepted" @click="emit('next')">{{ t('auth.register.next') }}</UiButton>
    </div>
  </div>
</template>
