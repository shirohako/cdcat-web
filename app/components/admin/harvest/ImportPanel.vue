<script setup lang="ts">
import type { HarvestSubmission } from '~/types/harvest'

/** Bundle files a harvester exported: zip volumes (or .jsonl.gz / .jsonl), several at once, uploaded one after another. */
const emit = defineEmits<{ imported: [submission: HarvestSubmission] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const harvestError = useHarvestError()

const input = useTemplateRef('input')
const busy = ref(false)
const progress = ref('')
const results = ref<Array<{ file: string, ok: boolean, text: string }>>([])
const upload = async () => {
  const files = [...(input.value?.files ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  if (!files.length || busy.value) return
  busy.value = true
  results.value = []
  for (const [index, file] of files.entries()) {
    progress.value = t('admin_pages.harvest.import.progress', { current: index + 1, total: files.length, file: file.name })
    try {
      const form = new FormData()
      form.append('file', file)
      const submission = await $api<HarvestSubmission>('/v1/admin/harvest/submissions', { method: 'POST', body: form })
      const counts = submission.counts
      results.value.push({ file: file.name, ok: true, text: t('admin_pages.harvest.import.done', {
        records: submission.records, new: counts.new ?? 0, changed: counts.changed ?? 0, unchanged: counts.unchanged ?? 0, images: (counts.images_new ?? 0) + (counts.images_known ?? 0),
      }) })
      emit('imported', submission)
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      results.value.push({ file: file.name, ok: false, text: status === 413 ? t('admin_pages.harvest.import.too_large') : harvestError(e) })
    }
  }
  progress.value = ''
  busy.value = false
  if (input.value) input.value.value = ''
}
</script>

<template>
  <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    <h2 class="font-semibold">{{ t('admin_pages.harvest.import.title') }}</h2>
    <p class="text-sm text-slate-600">{{ t('admin_pages.harvest.import.help') }}</p>
    <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" :class="{ 'opacity-60': busy }">
      <Icon name="lucide:upload" class="size-4" />
      {{ busy ? t('admin_pages.harvest.import.uploading') : t('admin_pages.harvest.import.pick') }}
      <input ref="input" type="file" multiple accept=".zip,.gz,.jsonl,application/zip,application/gzip" class="sr-only" :disabled="busy" @change="upload">
    </label>
    <p v-if="progress" role="status" class="text-sm text-slate-600">{{ progress }}</p>
    <ul v-if="results.length" class="space-y-1 text-sm">
      <li v-for="result in results" :key="result.file" :role="result.ok ? 'status' : 'alert'" :class="result.ok ? 'text-emerald-700' : 'text-red-700'">
        <span class="font-medium">{{ result.file }}</span>：{{ result.text }}
      </li>
    </ul>
  </section>
</template>
