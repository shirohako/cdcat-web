<script setup lang="ts">
import type { DeletionImpact } from '~/types/admin'
const props = defineProps<{ albumId: string | number, trackIds: number[] }>()
const emit = defineEmits<{ confirmed: [value: { checksum: string, reason: string }] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const open = ref(false)
const pending = ref(false)
const impact = ref<(DeletionImpact & { checksum: string }) | null>(null)
const error = ref(false)
const preview = async () => {
  pending.value = true
  error.value = false
  try {
    impact.value = await $api('/v1/revisions/deletion-preview', { method: 'POST', body: { resource_type: 'album', resource_id: props.albumId, track_ids: props.trackIds } })
    open.value = true
  } catch { error.value = true }
  finally { pending.value = false }
}
const confirm = (reason: string) => {
  if (!impact.value || impact.value.blockers.length) return
  open.value = false
  emit('confirmed', { checksum: impact.value.checksum, reason })
}
defineExpose({ preview })
</script>

<template>
  <p v-if="error" role="alert" class="text-sm text-red-700">{{ t('admin_pages.load_failed') }} <button type="button" @click="preview">{{ t('admin_pages.retry') }}</button></p>
  <p v-if="pending" role="status" class="text-sm text-slate-500">{{ t('common.loading') }}</p>
  <AdminConfirmDialog v-model="open" :title="t('admin_pages.impact')" reason-required :confirm-disabled="Boolean(impact?.blockers.length)" @confirm="confirm">
    <AdminImpactPreview v-if="impact" :impact="impact" />
  </AdminConfirmDialog>
</template>
