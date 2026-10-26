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

    <details class="rounded-lg border border-line" @toggle="previewOpen = ($event.target as HTMLDetailsElement).open">
      <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-body transition-colors hover:text-primary">{{ $t('editor.preview_changes', { count: totalChanges }) }}</summary>
      <div v-if="previewOpen" class="space-y-4 border-t border-line px-4 py-3">
        <div v-for="preview in previews" :key="preview.ref">
          <p class="mb-1 text-xs font-semibold text-meta">{{ enumLabel('catalog_type', preview.type) }} · {{ preview.label }}</p>
          <p v-if="preview.action === 'delete'" class="text-sm text-danger">{{ $t('editor.will_delete') }}</p>
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
    <p v-if="message" class="text-sm text-danger">{{ message }}</p>

    <EditorConflictResolver
      v-if="conflicts.length"
      :rebase="draft.rebase"
      :conflicts="conflicts"
      :type="mainType"
      @resolved="conflicts = []"
    />

    <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <button type="button" class="btn btn-primary" :disabled="draft.busy.value || !totalChanges" @click="submit">
        <span v-if="draft.busy.value" class="loading loading-spinner loading-xs" />
        {{ $t(canAutoApprove ? 'editor.submit_publish' : 'editor.submit_review') }}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="draft.saveState.value === 'saving'" @click="draft.save()">{{ $t('editor.save_draft') }}</button>
      <button v-if="draft.persisted.value" type="button" class="btn btn-ghost btn-sm text-danger" @click="discard">{{ $t(draft.revisionId.value ? 'editor.restored_discard' : 'editor.discard') }}</button>
      <span class="text-xs text-meta">{{ $t(canAutoApprove ? 'editor.publish_notice' : creates ? 'editor.pending_notice' : 'editor.review_notice') }}</span>
    </div>

    <UiDialog v-if="check" v-model="checkOpen" :title="check.title" :description="check.description" :icon="check.icon" :tone="check.tone" size="sm">
      <ul v-if="check.items.length" class="space-y-1 text-sm">
        <li v-for="item in check.items" :key="item.key">
          <button v-if="item.section" type="button" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-title transition-colors hover:bg-sunken" @click="goTo(item.section)">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="check.kind === 'suggested' ? 'bg-info' : 'bg-danger'" />
            <span class="min-w-0 flex-1">{{ item.label }}</span>
            <ChevronRight :size="14" class="shrink-0 text-meta" />
          </button>
          <p v-else class="rounded-lg px-2.5 py-1.5 text-body">
            <span v-if="item.path" class="mr-1.5 font-mono text-xs text-meta">{{ item.path }}</span>{{ item.label }}
          </p>
        </li>
      </ul>
      <template #footer>
        <template v-if="check.kind === 'suggested'">
          <button type="button" class="btn btn-sm btn-ghost" @click="goTo(check.items[0]?.section)">{{ $t('editor.check.improve') }}</button>
          <button type="button" class="btn btn-sm btn-primary" @click="send">{{ $t('editor.check.submit_anyway') }}</button>
        </template>
        <button v-else-if="check.kind === 'required'" type="button" class="btn btn-sm btn-primary" @click="goTo(check.items[0]?.section)">{{ $t('editor.check.go_fill') }}</button>
        <button v-else type="button" class="btn btn-sm btn-primary" @click="checkOpen = false">{{ $t('common.got_it') }}</button>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import type { DuplicateCandidate, Revision, RevisionConflict } from '~/types/revision'
import type { DiffCollection } from '~/utils/documentDiff'
import { documentDiff } from '~/utils/documentDiff'
import { ChevronRight } from '@lucide/vue'
import { errorName, revisionConflicts, revisionFieldErrors } from '~/utils/revisionErrors'

/** Something the editor checks before submitting, and the section where it is fixed. */
interface SubmitCheck { key: string, label: string, section: string }

const props = defineProps<{
  draft: ReturnType<typeof useRevisionDraft>
  /** Documents as loaded, by item ref; new items have none. */
  originals: Record<string, Record<string, unknown> | null>
  /** Names of items for the preview, by ref. */
  labels?: Record<string, string>
  /** What must be filled in before submitting: a dialog lists them instead of sending */
  required?: SubmitCheck[]
  /** What is worth adding: a dialog lists them, and the editor may submit anyway */
  suggested?: SubmitCheck[]
}>()
const emit = defineEmits<{ submitted: [Revision], errors: [Array<{ path: string, message: string }>], duplicates: [DuplicateCandidate[]], discarded: [], go: [section: string] }>()

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

// ---- the dialog the submit button answers with: what is missing, what is worth adding, what the server refused ----

interface CheckDialog {
  kind: 'required' | 'suggested' | 'errors' | 'failed'
  title: string
  description?: string
  icon: string
  tone: 'danger' | 'info' | 'warning'
  items: Array<{ key: string, label: string, section?: string, path?: string }>
}
const check = ref<CheckDialog | null>(null)
const checkOpen = ref(false)
const show = (dialog: CheckDialog) => {
  check.value = dialog
  checkOpen.value = true
}
const goTo = (section?: string) => {
  checkOpen.value = false
  if (section) emit('go', section)
}

/** Required items first (nothing is sent), then suggestions (the editor may go ahead), then the server's checks. */
const submit = () => {
  if (props.required?.length) {
    return show({ kind: 'required', title: t('editor.check.required_title'), description: t('editor.check.required_hint'), icon: 'lucide:circle-alert', tone: 'danger', items: props.required })
  }
  if (props.suggested?.length) {
    return show({ kind: 'suggested', title: t('editor.check.suggested_title'), description: t('editor.check.suggested_hint'), icon: 'lucide:lightbulb', tone: 'info', items: props.suggested })
  }
  return send()
}

const send = async () => {
  checkOpen.value = false
  errors.value = []
  conflicts.value = []
  message.value = ''
  try {
    emit('submitted', await props.draft.submit())
  } catch (error) {
    // The page's own submit asked first and the user said no.
    if (error instanceof DOMException && error.name === 'AbortError') return
    const name = errorName(error)
    if (name === 'REVISION_CONFLICT') conflicts.value = revisionConflicts(error)
    else if (name === 'VALIDATION_FAILED') errors.value = revisionFieldErrors(error)
    else if (name === 'DUPLICATE_SUSPECTED') {
      const details = (error as { details?: { details?: { candidates?: DuplicateCandidate[] } } }).details?.details
      emit('duplicates', details?.candidates ?? [])
    }
    if (!conflicts.value.length && !errors.value.length) message.value = localizeError(error)
    if (errors.value.length) {
      show({ kind: 'errors', title: t('editor.check.errors_title'), description: t('editor.fix_errors'), icon: 'lucide:circle-x', tone: 'danger',
        items: errors.value.map(entry => ({ key: entry.path, label: entry.message, path: shortPath(entry.path) })) })
    }
    else if (message.value && name !== 'DUPLICATE_SUSPECTED') {
      show({ kind: 'failed', title: t('editor.check.failed_title'), icon: 'lucide:triangle-alert', tone: 'warning', items: [{ key: 'message', label: message.value }] })
    }
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
