<script setup lang="ts">
import { Save, X } from '@lucide/vue'

// Preview (create) or diff (update), confirm, then POST /v1/revisions. Shared by the entry and series forms.
const props = defineProps<{
  payload: Record<string, unknown>
  resourceType: 'entry' | 'franchise'
  resourceId?: string | number
  baselineChecksum?: string
  /** Payload JSON at load time; set in edit mode to show a diff. */
  original?: string
  /** Returns false (and shows its own errors) when the form is invalid. */
  validate: () => boolean
  redirectTo?: string | ((revisionId: number) => string)
  successType: string
}>()

const router = useRouter()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()

const isEditMode = computed(() => props.resourceId !== undefined && props.resourceId !== '')
const currentJson = computed(() => JSON.stringify(props.payload, null, 2))
const hasChanges = computed(() => props.original !== currentJson.value)

const open = ref(false)
const confirming = ref(false)
const submitting = ref(false)
const message = ref('')

watch(currentJson, () => {
  open.value = false
  confirming.value = false
})

const start = () => {
  message.value = ''
  if (!props.validate()) return
  open.value = true
  confirming.value = false
}

const diffLines = computed(() => {
  const oldLines = (props.original || '').split('\n')
  const newLines = currentJson.value.split('\n')
  const result: Array<{ type: 'same' | 'added' | 'removed', content: string }> = []
  let i = 0
  let j = 0
  while (i < oldLines.length || j < newLines.length) {
    const oldLine = oldLines[i]
    const newLine = newLines[j]
    if (oldLine === newLine) {
      result.push({ type: 'same', content: oldLine || '' })
      i++
      j++
    } else if (oldLine !== undefined && (newLine === undefined || !newLines.slice(j).includes(oldLine))) {
      result.push({ type: 'removed', content: oldLine })
      i++
    } else {
      result.push({ type: 'added', content: newLine || '' })
      j++
    }
  }
  return result
})

const submit = async () => {
  message.value = ''
  submitting.value = true
  try {
    const body: Record<string, unknown> = {
      resource_type: props.resourceType,
      action: isEditMode.value ? 'update' : 'create',
      payload: props.payload,
    }
    if (isEditMode.value) {
      body.resource_id = Number(props.resourceId)
      if (props.baselineChecksum) body.baseline_checksum = props.baselineChecksum
    }
    const result = await $api<{ id: number }>('/v1/revisions', { method: 'POST', body })
    if (props.redirectTo) {
      await router.push(typeof props.redirectTo === 'function' ? props.redirectTo(result.id) : props.redirectTo)
      return
    }
    await router.push({ path: '/contribute/success', query: { type: props.successType, action: isEditMode.value ? 'update' : 'create' } })
  } catch (error: unknown) {
    message.value = localizeError(error, 'revision_entry.submit_failed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
      <button type="button" class="btn btn-primary" :disabled="submitting" @click="start">
        <Save class="h-4 w-4" />
        {{ submitting ? $t('revision_entry.processing') : (isEditMode ? $t('revision_entry.submit_changes') : $t('revision_entry.preview')) }}
      </button>
      <span class="text-sm text-gray-500">{{ $t('revision_entry.review_notice') }}</span>
    </div>

    <div v-if="open" class="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <h3 class="font-semibold text-gray-900">{{ isEditMode ? $t('revision_entry.compare') : $t('revision_entry.preview_data') }}</h3>

      <template v-if="!isEditMode">
        <div class="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-blue-100 bg-white p-3 font-mono text-xs text-gray-700">{{ currentJson }}</div>
      </template>
      <template v-else>
        <p v-if="!hasChanges" class="text-sm text-gray-500">{{ $t('revision_entry.no_changes') }}</p>
        <div v-else class="max-h-96 overflow-auto rounded-lg border border-blue-100 bg-white p-3 font-mono text-xs">
          <div
            v-for="(line, index) in diffLines"
            :key="index"
            class="whitespace-pre"
            :class="{ 'bg-green-100 text-green-800': line.type === 'added', 'bg-red-100 text-red-800': line.type === 'removed', 'text-gray-700': line.type === 'same' }"
          ><span class="mr-2 select-none opacity-50">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>{{ line.content }}</div>
        </div>
      </template>

      <div v-if="isEditMode && !confirming" class="flex items-center gap-2">
        <button type="button" class="btn btn-primary btn-sm" :disabled="!hasChanges" @click="confirming = true">{{ $t('revision_entry.confirm_changes') }}</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="open = false">{{ $t('revision_entry.back_edit') }}</button>
      </div>
      <div v-else class="space-y-3" :class="{ 'border-t border-blue-200 pt-3': isEditMode }">
        <p v-if="isEditMode" class="text-sm text-gray-700">{{ $t('revision_entry.confirm_question') }}</p>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm" :disabled="submitting" @click="submit">
            {{ submitting ? $t('revision_entry.submitting') : $t('revision_entry.confirm_submit') }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="isEditMode ? (confirming = false) : (open = false)">{{ $t('revision_entry.back_edit') }}</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="alert alert-error">
      <X class="h-5 w-5" />
      <span>{{ message }}</span>
    </div>
  </div>
</template>
