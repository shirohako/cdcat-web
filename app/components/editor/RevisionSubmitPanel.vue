<template>
  <div class="space-y-4">
    <label class="form-control">
      <span class="label-text mb-1 text-sm font-medium">{{ $t('editor.summary') }}</span>
      <textarea v-model="summary" rows="2" class="textarea text-sm" :placeholder="$t('editor.summary_placeholder')" />
    </label>
    <label class="form-control">
      <span class="label-text mb-1 text-sm font-medium">{{ $t('editor.sources') }}</span>
      <textarea :value="sources.join('\n')" rows="2" class="textarea font-mono text-xs" :placeholder="$t('editor.sources_placeholder')" @input="setSources(($event.target as HTMLTextAreaElement).value)" />
    </label>

    <details class="rounded-lg border border-gray-200" @toggle="previewOpen = ($event.target as HTMLDetailsElement).open">
      <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700">{{ $t('editor.preview_changes', { count: totalChanges }) }}</summary>
      <div v-if="previewOpen" class="space-y-4 border-t border-gray-100 px-4 py-3">
        <div v-for="preview in previews" :key="preview.ref">
          <p class="mb-1 text-xs font-semibold text-gray-500">{{ enumLabel('catalog_type', preview.type) }} · {{ preview.label }}</p>
          <p v-if="preview.action === 'delete'" class="text-sm text-error">{{ $t('editor.will_delete') }}</p>
          <CatalogDiffView v-else :type="preview.type" :changes="preview.changes" :references="references" :documents="[preview.document, preview.original]" />
        </div>
      </div>
    </details>

    <div v-if="errors.length" class="alert alert-error block text-sm">
      <p class="mb-1 font-semibold">{{ $t('editor.fix_errors') }}</p>
      <ul class="list-inside list-disc space-y-0.5">
        <li v-for="error in errors" :key="error.path"><span class="font-mono text-xs opacity-70">{{ shortPath(error.path) }}</span> {{ error.message }}</li>
      </ul>
    </div>
    <p v-if="message" class="text-sm text-error">{{ message }}</p>

    <EditorConflictResolver
      v-if="conflicts.length"
      :rebase="draft.rebase"
      :conflicts="conflicts"
      :type="mainType"
      @resolved="conflicts = []"
    />

    <div class="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
      <button type="button" class="btn btn-primary" :disabled="draft.busy.value || !totalChanges" @click="submit">
        <span v-if="draft.busy.value" class="loading loading-spinner loading-xs" />
        {{ $t(canAutoApprove ? 'editor.submit_publish' : 'editor.submit_review') }}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="draft.saveState.value === 'saving'" @click="draft.save()">{{ $t('editor.save_draft') }}</button>
      <button v-if="draft.persisted.value" type="button" class="btn btn-ghost btn-sm text-error" @click="discard">{{ $t(draft.revisionId.value ? 'editor.restored_discard' : 'editor.discard') }}</button>
      <span class="text-xs text-gray-400">{{ $t(canAutoApprove ? 'editor.publish_notice' : creates ? 'editor.pending_notice' : 'editor.review_notice') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import type { DuplicateCandidate, Revision, RevisionConflict } from '~/types/revision'
import type { DiffCollection } from '~/utils/documentDiff'
import { documentDiff } from '~/utils/documentDiff'
import { errorName, revisionConflicts, revisionFieldErrors } from '~/utils/revisionErrors'

const props = defineProps<{
  draft: ReturnType<typeof useRevisionDraft>
  /** Documents as loaded, by item ref; new items have none. */
  originals: Record<string, Record<string, unknown> | null>
  /** Names of items for the preview, by ref. */
  labels?: Record<string, string>
}>()
const emit = defineEmits<{ submitted: [Revision], errors: [Array<{ path: string, message: string }>], duplicates: [DuplicateCandidate[]], discarded: [] }>()

const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { hasPermission } = useAuth()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()

const canAutoApprove = computed(() => hasPermission('revisions.auto-approve'))
/** New content goes live at submission, marked as awaiting review (docs/catalog/editing.md#待审内容). */
const creates = computed(() => props.draft.items.value.some(item => item.action === 'create'))
// The draft's own refs; edits go straight into the revision being saved.
const { summary, sources } = props.draft
const setSources = (text: string) => { sources.value = text.split('\n') }
const references = computed(() => props.draft.references)
const mainType = computed(() => (props.draft.items.value[0]?.resource_type ?? 'album') as CatalogType)
const previewOpen = ref(false)

const collectionsOf = (type: string) => ((schema.value?.aggregates?.[type] as { collections?: DiffCollection[] } | undefined)?.collections ?? [])

const previews = computed(() => props.draft.prepared.value.map((item) => {
  const original = props.originals[item.ref] ?? null
  const document = item.document ?? {}
  return {
    ref: item.ref,
    type: item.resource_type,
    action: item.action,
    label: props.labels?.[item.ref] ?? String(document.title ?? document.name ?? item.ref),
    document,
    original,
    changes: item.action === 'delete' ? [] : documentDiff(original, document, collectionsOf(item.resource_type)),
  }
}))
const totalChanges = computed(() => previews.value.reduce((sum, preview) => sum + (preview.action === 'delete' ? 1 : preview.changes.length), 0))

const errors = ref<Array<{ path: string, message: string }>>([])
const conflicts = ref<RevisionConflict[]>([])
const message = ref('')

/** "items.album.tracks.t1.title" → "tracks.t1.title" */
const shortPath = (path: string) => path.replace(/^items\.[^.]+\./, '')

const submit = async () => {
  errors.value = []
  conflicts.value = []
  message.value = ''
  try {
    emit('submitted', await props.draft.submit())
  } catch (error) {
    const name = errorName(error)
    if (name === 'REVISION_CONFLICT') conflicts.value = revisionConflicts(error)
    else if (name === 'VALIDATION_FAILED') errors.value = revisionFieldErrors(error)
    else if (name === 'DUPLICATE_SUSPECTED') {
      const details = (error as { details?: { details?: { candidates?: DuplicateCandidate[] } } }).details?.details
      emit('duplicates', details?.candidates ?? [])
    }
    if (!conflicts.value.length && !errors.value.length) message.value = localizeError(error)
  } finally {
    emit('errors', errors.value)
  }
}

const discard = async () => {
  if (!await confirm({ title: t(props.draft.revisionId.value ? 'editor.restored_discard_confirm' : 'editor.discard_confirm'), confirmText: t(props.draft.revisionId.value ? 'editor.restored_discard' : 'editor.discard') })) return
  await props.draft.discard()
  emit('discarded')
}
</script>
