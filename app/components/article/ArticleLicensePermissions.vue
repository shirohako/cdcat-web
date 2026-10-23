<template>
  <span class="flex flex-wrap gap-1">
    <span v-for="permission in PERMISSIONS" :key="permission" class="rounded px-1.5 py-px text-[10px]" :class="TONES[info[permission]]">
      {{ t(`article_ui.licenses.permissions.${permission}`) }} {{ t(`article_ui.licenses.permissions.${info[permission]}`) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import type { LicenseInfo, LicensePermission } from '~/utils/articleLicenses'

/** What a license lets readers do: repost, use commercially, adapt (yes, no, or under the same license). */
defineProps<{ info: LicenseInfo }>()
const { t } = useI18n()

const PERMISSIONS = ['reprint', 'commercial', 'derivatives'] as const
const TONES: Record<LicensePermission, string> = {
  yes: 'bg-emerald-50 text-emerald-700',
  share_alike: 'bg-amber-50 text-amber-700',
  no: 'bg-slate-100 text-slate-400 line-through',
}
</script>
