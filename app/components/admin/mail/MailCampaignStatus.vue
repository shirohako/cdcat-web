<script setup lang="ts">
import type { AdminMailCampaignStatus } from '~/types/admin'

defineProps<{ status: AdminMailCampaignStatus }>()
const { t } = useAdminI18n()
const styles: Record<AdminMailCampaignStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-sky-100 text-sky-800',
  sending: 'bg-amber-100 text-amber-900',
  sent: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-50 text-red-700',
}
</script>

<template>
  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="styles[status]">{{ t(`admin_pages.mail.campaign_status.${status}`) }}</span>
</template>
