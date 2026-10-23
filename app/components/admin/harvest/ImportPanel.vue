<script setup lang="ts">
import type { HarvestSubmission } from '~/types/harvest'

const emit = defineEmits<{ imported: [submission: HarvestSubmission] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const harvestError = useHarvestError()

const input = useTemplateRef('input')
const busy = ref(false)
const notice = ref('')
const failure = ref('')
const upload = async () => {
  const file = input.value?.files?.[0]
  if (!file || busy.value) return
  busy.value = true
  notice.value = ''
  failure.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    const submission = await $api<HarvestSubmission>('/v1/admin/harvest/submissions', { method: 'POST', body: form })
    const counts = submission.counts
    notice.value = t('admin_pages.harvest.import.done', { records: submission.records, new: counts.new ?? 0, changed: counts.changed ?? 0, unchanged: counts.unchanged ?? 0 })
    emit('imported', submission)
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    failure.value = status === 413 ? t('admin_pages.harvest.import.too_large') : harvestError(e)
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}
</script>

<template>
  <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    <h2 class="font-semibold">{{ t('admin_pages.harvest.import.title') }}</h2>
    <p class="text-sm text-slate-600">{{ t('admin_pages.harvest.import.help') }}</p>
    <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" :class="{ 'opacity-60': busy }">
      <Icon name="lucide:upload" class="size-4" />
      {{ busy ? t('admin_pages.harvest.import.uploading') : t('admin_pages.harvest.import.pick') }}
      <input ref="input" type="file" accept=".gz,.jsonl,application/gzip" class="sr-only" :disabled="busy" @change="upload">
    </label>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="failure" role="alert" class="text-sm text-red-700">{{ failure }}</p>
  </section>
</template>
