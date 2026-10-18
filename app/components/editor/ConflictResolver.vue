<template>
  <div class="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
    <div>
      <h3 class="font-semibold text-amber-900">{{ $t('editor.conflicts_title') }}</h3>
      <p class="text-sm text-amber-800">{{ $t('editor.conflicts_hint') }}</p>
    </div>
    <ul class="space-y-2">
      <li v-for="conflict in conflicts" :key="conflict.id" class="rounded-md bg-white p-3 text-sm shadow-sm">
        <p class="mb-2 text-xs text-gray-500">
          <span class="badge badge-warning badge-xs mr-1">{{ $t(`editor.conflict_kind.${conflict.kind}`) }}</span>
          {{ describePath(conflict.path) }}
        </p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label class="flex cursor-pointer items-start gap-2 rounded border p-2" :class="choices[conflict.id] === 'mine' ? 'border-primary bg-primary/5' : 'border-gray-200'">
            <input v-model="choices[conflict.id]" type="radio" value="mine" class="radio radio-sm mt-0.5">
            <span><span class="block text-[11px] text-gray-400">{{ $t('editor.mine') }}</span>{{ show(conflict.mine) }}</span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 rounded border p-2" :class="choices[conflict.id] === 'current' ? 'border-primary bg-primary/5' : 'border-gray-200'">
            <input v-model="choices[conflict.id]" type="radio" value="current" class="radio radio-sm mt-0.5">
            <span><span class="block text-[11px] text-gray-400">{{ $t('editor.current') }}</span>{{ show(conflict.current) }}</span>
          </label>
        </div>
      </li>
    </ul>
    <p v-if="message" class="text-sm text-error">{{ message }}</p>
    <button type="button" class="btn btn-sm btn-warning" :disabled="busy || Object.keys(choices).length < conflicts.length" @click="resolve">{{ $t('editor.resolve') }}</button>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { RevisionConflict } from '~/types/revision'

const props = defineProps<{
  conflicts: RevisionConflict[]
  type: CatalogType
  /** Merges one item with the chosen side of each of its conflicts: a stored revision or a draft in this browser. */
  rebase: (ref: string, resolutions: Record<string, 'mine' | 'current'>) => Promise<unknown>
}>()
const emit = defineEmits<{ resolved: [] }>()

const { localizeError } = useLocalizedApiError()
const { fieldLabel, collectionLabel } = useDocumentSchema(() => props.type)

const choices = reactive<Record<string, 'mine' | 'current'>>({})
const busy = ref(false)
const message = ref('')

const describePath = (path: Array<string | number>) => path.length === 1
  ? fieldLabel(String(path[0]))
  : [collectionLabel(String(path[0])), `#${path[1]}`, path[2] !== undefined ? fieldLabel(String(path[2])) : ''].filter(Boolean).join(' · ')
const show = (value: unknown) => value === null || value === undefined ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)

const resolve = async () => {
  busy.value = true
  message.value = ''
  try {
    const byRef = new Map<string, Record<string, 'mine' | 'current'>>()
    for (const conflict of props.conflicts) {
      const ref = conflict.ref ?? 'main'
      byRef.set(ref, { ...(byRef.get(ref) ?? {}), [conflict.id]: choices[conflict.id]! })
    }
    for (const [ref, resolutions] of byRef) {
      await props.rebase(ref, resolutions)
    }
    emit('resolved')
  } catch (error) {
    message.value = localizeError(error)
  } finally {
    busy.value = false
  }
}
</script>
