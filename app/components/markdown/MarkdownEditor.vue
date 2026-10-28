<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AlertTriangle, Bold, Braces, ChevronDown, Code, ExternalLink, Eye, EyeOff,
  Heading2, HelpCircle, Highlighter, Image, Info, Italic, Lightbulb, Link,
  ListChecks, ListOrdered, Palette, Pencil, Quote, ShieldAlert, Strikethrough,
  Type, Underline,
} from 'lucide'
import { basicSetup, EditorView } from 'codemirror'
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { keymap, placeholder as editorPlaceholder } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion, type Completion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import RichContent from './RichContent.vue'
import MdDropdown from './internal/MdDropdown.vue'
import MdIcon from './internal/MdIcon.vue'
import { useMarkdownT } from '~/utils/markdownI18n'
import {
  markdownContainers, MARKDOWN_TEXT_COLORS, MARKDOWN_TEXT_SIZES, MARKDOWN_UNDERLINE_COLORS,
  type MarkdownContainerName, type MarkdownEnv, type MarkdownTextColor, type MarkdownTextSize, type MarkdownUnderlineColor,
} from '~/utils/markdown'
import {
  applyMarkdownEdit, applyMarkdownTextStyle, markdownContainerSnippet, MARKDOWN_GUIDE_URL, siteUrlToToken,
  type MarkdownCompleter, type MarkdownEditAction,
} from '~/utils/markdownEditor'

const props = withDefaults(defineProps<{
  disabled?: boolean
  error?: string
  placeholder?: string
  /**
   * Where the "syntax guide" banner links. Defaults to `MARKDOWN_GUIDE_URL`;
   * pass `null` to drop the banner. The compact variant never shows it.
   */
  guideUrl?: string | null
  /** `split` shows the editor beside the preview (one at a time on small screens). */
  mode?: 'split' | 'edit' | 'preview'
  /**
   * `compact` is the small editor for sub-replies: a short box, the common
   * buttons only, and a preview toggle instead of a split view.
   */
  variant?: 'full' | 'compact'
  /** Fill the parent's height and scroll inside, keeping the toolbar in view. */
  fill?: boolean
  /** Shows a character count and marks the editor once the text is longer. */
  maxLength?: number
  /** Supplies what mentions, quotes and `[[…]]` tokens in the preview point to. */
  resolveEnv?: (raw: string) => Promise<MarkdownEnv | null>
  /** Supplies completions after `@` and `[[`. */
  complete?: MarkdownCompleter
  /**
   * Uploads an image and resolves to its address. When given, the image button
   * picks a file and images can be pasted or dropped; otherwise it inserts a
   * URL template.
   */
  upload?: (file: File) => Promise<string>
}>(), {
  disabled: false,
  error: '',
  placeholder: '',
  guideUrl: undefined,
  mode: 'split',
  variant: 'full',
  fill: false,
  maxLength: undefined,
  resolveEnv: undefined,
  complete: undefined,
  upload: undefined,
})
const emit = defineEmits<{ save: [], submit: [] }>()

const model = defineModel<string>({ required: true })
const { t } = useMarkdownT()
const { appliedTheme } = useAppearance()
const editorHost = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const mobilePane = ref<'edit' | 'preview'>('edit')
const compactPreview = ref(false)
const preview = ref(model.value)
const previewEnv = ref<MarkdownEnv | null>(null)
let view: EditorView | undefined
let previewTimer: ReturnType<typeof setTimeout> | undefined
let envTimer: ReturnType<typeof setTimeout> | undefined
let uploadCount = 0
const readOnly = new Compartment()
// Only tells CodeMirror's own defaults which theme is on; every colour below is a theme token already.
const darkMode = new Compartment()

const compact = computed(() => props.variant === 'compact')
// `undefined` means "not specified", which falls back to the default guide;
// an explicit `null` is a deliberate request to hide the banner.
const guideHref = computed(() => compact.value ? null : props.guideUrl === undefined ? MARKDOWN_GUIDE_URL : props.guideUrl)
const length = computed(() => Array.from(model.value ?? '').length)
const tooLong = computed(() => props.maxLength !== undefined && length.value > props.maxLength)

const fullToolbar: { action: MarkdownEditAction, icon: typeof Bold, labelKey: string }[] = [
  { action: 'heading', icon: Heading2, labelKey: 'markdown.editor.toolbar.heading' },
  { action: 'bold', icon: Bold, labelKey: 'markdown.editor.toolbar.bold' },
  { action: 'italic', icon: Italic, labelKey: 'markdown.editor.toolbar.italic' },
  { action: 'strike', icon: Strikethrough, labelKey: 'markdown.editor.toolbar.strike' },
  { action: 'mark', icon: Highlighter, labelKey: 'markdown.editor.toolbar.mark' },
  { action: 'inlineSpoiler', icon: Eye, labelKey: 'markdown.editor.toolbar.inlineSpoiler' },
  { action: 'quote', icon: Quote, labelKey: 'markdown.editor.toolbar.quote' },
  { action: 'link', icon: Link, labelKey: 'markdown.editor.toolbar.link' },
  { action: 'image', icon: Image, labelKey: 'markdown.editor.toolbar.image' },
  { action: 'code', icon: Code, labelKey: 'markdown.editor.toolbar.code' },
]
const COMPACT_ACTIONS: MarkdownEditAction[] = ['bold', 'italic', 'strike', 'inlineSpoiler', 'link', 'code']
const toolbar = computed(() => compact.value ? fullToolbar.filter(item => COMPACT_ACTIONS.includes(item.action)) : fullToolbar)

const containerMenuMeta: Record<MarkdownContainerName, {
  icon: typeof Bold
  englishLabel: string
  iconClass: string
}> = {
  details: { icon: ChevronDown, englishLabel: 'Details', iconClass: 'bg-btn text-btn-content' },
  info: { icon: Info, englishLabel: 'Info', iconClass: 'bg-info/15 text-info' },
  tip: { icon: Lightbulb, englishLabel: 'Tip', iconClass: 'bg-success/15 text-success' },
  warning: { icon: AlertTriangle, englishLabel: 'Warning', iconClass: 'bg-warning/15 text-warning' },
  danger: { icon: ShieldAlert, englishLabel: 'Danger', iconClass: 'bg-danger/15 text-danger' },
  checklist: { icon: ListChecks, englishLabel: 'Checklist', iconClass: 'bg-primary/15 text-primary' },
  steps: { icon: ListOrdered, englishLabel: 'Steps', iconClass: 'bg-primary/15 text-primary' },
  spoiler: { icon: EyeOff, englishLabel: 'Spoiler', iconClass: 'bg-btn text-btn-content' },
}

/** Markdown in the editor, coloured with the theme tokens (code-block languages use the Markdown text colours). */
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--title)', fontWeight: '700' },
  { tag: tags.strong, color: 'var(--title)', fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, color: 'var(--meta)', textDecoration: 'line-through' },
  { tag: [tags.link, tags.url], color: 'var(--primary)' },
  { tag: tags.monospace, color: 'var(--title)', backgroundColor: 'var(--code)', borderRadius: '3px' },
  { tag: tags.quote, color: 'var(--meta)' },
  { tag: [tags.processingInstruction, tags.contentSeparator, tags.meta], color: 'var(--faint)' },
  { tag: [tags.keyword, tags.atom, tags.bool], color: 'var(--md-purple)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--md-green)' },
  { tag: tags.number, color: 'var(--md-orange)' },
  { tag: [tags.variableName, tags.propertyName], color: 'var(--md-blue)' },
  { tag: tags.comment, color: 'var(--meta)', fontStyle: 'italic' },
  { tag: tags.invalid, color: 'var(--danger)' },
])

/** The preview follows the text after a short pause; references after a longer one, and only when needed. */
function schedulePreview(value: string) {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { preview.value = value }, 150)
  clearTimeout(envTimer)
  if (!props.resolveEnv || !/@|\[\[|:::+\s*quote/.test(value)) return
  const resolve = props.resolveEnv
  envTimer = setTimeout(async () => {
    try {
      previewEnv.value = await resolve(value)
    }
    catch {
      // The preview simply keeps the references it had.
    }
  }, 800)
}

function containerCompletions(context: CompletionContext) {
  const match = context.matchBefore(/:::\s*[a-z-]*/i)
  if (!match || (!context.explicit && match.from === match.to)) return null
  return {
    from: match.from,
    options: markdownContainers.map(definition => ({
      label: `::: ${definition.name}`,
      displayLabel: t(definition.labelKey),
      detail: t(definition.descriptionKey),
      type: 'keyword',
      apply: markdownContainerSnippet(definition.name),
    })),
    validFor: /^:::\s*[a-z-]*$/i,
  }
}

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** `@name` completion, offered where a mention can start (not inside URLs or e-mail addresses). */
async function mentionCompletions(context: CompletionContext): Promise<CompletionResult | null> {
  if (!props.complete) return null
  const match = context.matchBefore(/@[A-Za-z0-9_-]*/)
  if (!match) return null
  const before = match.from > 0 ? context.state.sliceDoc(match.from - 1, match.from) : ''
  if (before && (!/[\s\p{P}]/u.test(before) || '/\\.:@#&=?%+~_-'.includes(before))) return null
  const complete = props.complete
  await pause(200)
  if (context.aborted) return null
  const items = await complete('mention', match.text.slice(1)).catch(() => [])
  if (context.aborted || !items.length) return null
  return {
    from: match.from,
    filter: false,
    options: items.map((item): Completion => ({ label: item.label, detail: item.detail ?? undefined, type: 'variable', apply: item.apply })),
  }
}

/** `[[` completion: searches the database and inserts `[[type:id]]`, eating auto-closed brackets. */
async function refCompletions(context: CompletionContext): Promise<CompletionResult | null> {
  if (!props.complete) return null
  const match = context.matchBefore(/\[\[[^\]\n]*/)
  if (!match) return null
  const complete = props.complete
  await pause(200)
  if (context.aborted) return null
  const items = await complete('ref', match.text.slice(2)).catch(() => [])
  if (context.aborted || !items.length) return null
  return {
    from: match.from,
    filter: false,
    options: items.map((item): Completion => ({
      label: item.label,
      detail: item.detail ?? undefined,
      type: 'class',
      apply: (target, _completion, from, to) => {
        const after = target.state.sliceDoc(to, to + 2)
        const end = after === ']]' ? to + 2 : after.startsWith(']') ? to + 1 : to
        target.dispatch({ changes: { from, to: end, insert: item.apply }, selection: { anchor: from + item.apply.length } })
      },
    })),
  }
}

/** Replaces an upload placeholder once the file is stored, or removes it on failure. */
function replacePlaceholder(placeholder: string, replacement: string) {
  if (!view) return
  const position = view.state.doc.toString().indexOf(placeholder)
  if (position < 0) return
  view.dispatch({ changes: { from: position, to: position + placeholder.length, insert: replacement } })
}

async function uploadFiles(files: File[]) {
  if (!props.upload || !view) return
  for (const file of files.filter(item => item.type.startsWith('image/'))) {
    uploadCount += 1
    const placeholder = `![${t('markdown.editor.uploading')}](uploading-${uploadCount})`
    insert(`${placeholder}\n`)
    try {
      const url = await props.upload(file)
      replacePlaceholder(placeholder, `![${file.name.replace(/[[\]]/g, '')}](${url})`)
    }
    catch {
      replacePlaceholder(placeholder, '')
    }
  }
}

onMounted(() => {
  if (!editorHost.value) return
  view = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: model.value,
      extensions: [
        basicSetup,
        markdown(),
        syntaxHighlighting(markdownHighlight),
        darkMode.of(EditorView.darkTheme.of(appliedTheme.value === 'dark')),
        autocompletion({ override: [containerCompletions, mentionCompletions, refCompletions] }),
        Prec.high(keymap.of([
          { key: 'Mod-s', preventDefault: true, run: () => { emit('save'); return true } },
          { key: 'Mod-Enter', preventDefault: true, run: () => { emit('submit'); return true } },
        ])),
        editorPlaceholder(props.placeholder || t('markdown.editor.placeholder')),
        readOnly.of(EditorState.readOnly.of(props.disabled)),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': t('markdown.editor.ariaLabel'),
          'spellcheck': 'true',
        }),
        EditorView.domEventHandlers({
          paste: (event) => {
            const files = [...(event.clipboardData?.files ?? [])]
            if (props.upload && files.some(file => file.type.startsWith('image/'))) {
              event.preventDefault()
              void uploadFiles(files)
              return true
            }
            const token = siteUrlToToken(event.clipboardData?.getData('text/plain'), window.location.host)
            if (!token) return false
            event.preventDefault()
            insert(token)
            return true
          },
          drop: (event) => {
            const files = [...(event.dataTransfer?.files ?? [])]
            if (!props.upload || !files.some(file => file.type.startsWith('image/'))) return false
            event.preventDefault()
            void uploadFiles(files)
            return true
          },
        }),
        EditorView.theme({
          '&': { minHeight: compact.value ? '6rem' : '18rem', height: '100%', fontSize: '14px', color: 'var(--title)', backgroundColor: 'var(--field)' },
          '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: '1.65' },
          '.cm-content': { padding: compact.value ? '8px 0' : '12px 0', caretColor: 'var(--primary)' },
          '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--primary)' },
          '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { backgroundColor: 'var(--selection)' },
          '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--title) 4%, transparent)' },
          '.cm-gutters': compact.value ? { display: 'none' } : { backgroundColor: 'var(--sunken)', borderRight: '1px solid var(--line)', color: 'var(--faint)' },
          '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--body)' },
          '.cm-placeholder': { color: 'var(--faint)' },
          '&.cm-focused .cm-matchingBracket': { backgroundColor: 'color-mix(in oklab, var(--primary) 25%, transparent)', outline: 'none' },
          '.cm-searchMatch': { backgroundColor: 'color-mix(in oklab, var(--warning) 30%, transparent)', outline: 'none' },
          '.cm-tooltip': { backgroundColor: 'var(--popover)', color: 'var(--body)', border: 'none', borderRadius: '0.5rem', boxShadow: '0 0 0 1px var(--line), var(--overlay-shadow)', overflow: 'hidden' },
          '.cm-tooltip-autocomplete > ul > li': { padding: '4px 10px' },
          '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'color-mix(in oklab, var(--primary) 20%, transparent)', color: 'var(--title)' },
          '.cm-completionDetail': { color: 'var(--meta)' },
          '.cm-completionMatchedText': { color: 'var(--primary)', textDecoration: 'none' },
          '.cm-panels': { backgroundColor: 'var(--sunken)', color: 'var(--body)' },
          '.cm-textfield': { backgroundColor: 'var(--field)', border: '1px solid var(--line)', color: 'var(--title)' },
          '.cm-button': { backgroundImage: 'none', backgroundColor: 'var(--btn)', border: 'none', color: 'var(--btn-content)' },
          '&.cm-focused': { outline: 'none' },
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          const value = update.state.doc.toString()
          model.value = value
          schedulePreview(value)
        }),
      ],
    }),
  })
  schedulePreview(model.value)
})

watch(model, (value) => {
  schedulePreview(value)
  if (!view || value === view.state.doc.toString()) return
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
})

watch(() => props.disabled, (value) => {
  view?.dispatch({ effects: readOnly.reconfigure(EditorState.readOnly.of(value)) })
})

watch(appliedTheme, (value) => {
  view?.dispatch({ effects: darkMode.reconfigure(EditorView.darkTheme.of(value === 'dark')) })
})

// CodeMirror measures its layout when shown again, e.g. after the preview-only mode.
watch(() => [props.mode, compactPreview.value], async () => {
  await nextTick()
  view?.requestMeasure()
})

const editorVisibility = computed(() => {
  if (compact.value) return compactPreview.value ? 'hidden' : 'block'
  return props.mode === 'preview' ? 'hidden' : props.mode === 'edit' ? 'block' : mobilePane.value === 'edit' ? 'block' : 'hidden md:block'
})
const previewVisibility = computed(() => {
  if (compact.value) return compactPreview.value ? 'block' : 'hidden'
  return props.mode === 'edit' ? 'hidden' : props.mode === 'preview' ? 'block' : mobilePane.value === 'preview' ? 'block' : 'hidden md:block'
})

/** Replaces the selection with `text`, e.g. a quote or an image the page inserted. */
function insert(text: string) {
  if (!view || props.disabled) return
  const selection = view.state.selection.main
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: text },
    selection: { anchor: selection.from + text.length },
    scrollIntoView: true,
  })
  view.focus()
}

function focus() {
  compactPreview.value = false
  view?.focus()
}

/** Moves the cursor to a 0-based source line, as `markdownHeadings()` reports it, and scrolls it to the top. */
function scrollToLine(line: number) {
  if (!view) return
  const target = view.state.doc.line(Math.min(Math.max(line + 1, 1), view.state.doc.lines))
  view.dispatch({ selection: { anchor: target.from }, effects: EditorView.scrollIntoView(target.from, { y: 'start', yMargin: 12 }) })
  view.focus()
}

defineExpose({ insert, focus, scrollToLine })

onUnmounted(() => {
  clearTimeout(previewTimer)
  clearTimeout(envTimer)
  view?.destroy()
})

function applyAction(action: MarkdownEditAction) {
  if (!view || props.disabled) return
  if (action === 'image' && props.upload) {
    fileInput.value?.click()
    return
  }
  const selection = view.state.selection.main
  const result = applyMarkdownEdit(view.state.doc.toString(), selection.from, selection.to, action)
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: result.text },
    selection: { anchor: result.selectionFrom, head: result.selectionTo },
    scrollIntoView: true,
  })
  view.focus()
}

function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement
  void uploadFiles([...(input.files ?? [])])
  input.value = ''
}

function insertContainer(name: MarkdownContainerName) {
  if (!view || props.disabled) return
  const selection = view.state.selection.main
  const selected = view.state.doc.sliceString(selection.from, selection.to)
  const snippet = markdownContainerSnippet(name, selected)
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: snippet },
    selection: { anchor: selection.from + snippet.indexOf('\n') + 1 },
    scrollIntoView: true,
  })
  view.focus()
}

function applyTextStyle(kind: 'color' | 'size' | 'underline', value: MarkdownTextColor | MarkdownTextSize | MarkdownUnderlineColor) {
  if (!view || props.disabled) return
  const selection = view.state.selection.main
  const result = applyMarkdownTextStyle(view.state.doc.toString(), selection.from, selection.to, kind, value)
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: result.text },
    selection: { anchor: result.selectionFrom, head: result.selectionTo },
    scrollIntoView: true,
  })
  view.focus()
}
</script>

<template>
  <a
    v-if="guideHref"
    :href="guideHref"
    target="_blank"
    rel="noopener noreferrer"
    class="group mb-3 flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-left transition-colors duration-150 ease-out hover:bg-primary/14 sm:px-3.5"
  >
    <span class="grid size-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
      <MdIcon :icon="HelpCircle" class="size-4" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-bold text-title">{{ t('markdown.editor.help') }}</span>
      <span class="block text-xs leading-4 text-meta">{{ t('markdown.editor.helpHint') }}</span>
    </span>
    <MdIcon :icon="ExternalLink" class="size-4 shrink-0 text-primary transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
  </a>

  <div class="overflow-hidden rounded-xl border bg-field" :class="[error || tooLong ? 'border-danger/60' : 'border-line', fill ? 'flex h-full min-h-0 flex-col' : '']">
    <div
      class="grid shrink-0 grid-cols-1 items-center gap-1.5 border-b border-line bg-card px-2 py-1.5 md:gap-2"
      :class="compact ? 'grid-cols-[minmax(0,1fr)_auto] py-1' : 'md:grid-cols-[minmax(0,1fr)_auto]'"
    >
      <div class="order-1 flex min-w-0 flex-wrap items-center gap-1">
        <button
          v-for="item in toolbar"
          :key="item.action"
          type="button"
          :disabled="disabled || (compact && compactPreview)"
          class="grid place-items-center rounded-md text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary disabled:opacity-40"
          :class="compact ? 'size-7' : 'size-8'"
          :title="t(item.labelKey)"
          :aria-label="t(item.labelKey)"
          @click="applyAction(item.action)"
        >
          <MdIcon :icon="item.icon" :class="compact ? 'size-3.5' : 'size-4'" />
        </button>

        <div v-if="!compact" class="flex shrink-0 items-center gap-1 max-sm:basis-full">
          <MdDropdown>
            <button
              type="button"
              :disabled="disabled"
              class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary disabled:opacity-40"
            >
              <MdIcon :icon="Type" class="size-4" />
              {{ t('markdown.editor.toolbar.size') }}
            </button>
            <template #menu="{ close }">
              <button
                v-for="(_, value) in MARKDOWN_TEXT_SIZES"
                :key="value"
                type="button"
                role="menuitem"
                class="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                @click="applyTextStyle('size', value); close()"
              >
                <span>{{ t(`markdown.editor.sizes.${value}`) }}</span>
                <span :class="MARKDOWN_TEXT_SIZES[value]">Aa</span>
              </button>
            </template>
          </MdDropdown>

          <MdDropdown>
            <button
              type="button"
              :disabled="disabled"
              class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary disabled:opacity-40"
            >
              <MdIcon :icon="Palette" class="size-4" />
              {{ t('markdown.editor.toolbar.color') }}
            </button>
            <template #menu="{ close }">
              <button
                v-for="(className, value) in MARKDOWN_TEXT_COLORS"
                :key="value"
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                @click="applyTextStyle('color', value); close()"
              >
                <span class="size-3 rounded-full bg-current" :class="className" />
                {{ t(`markdown.editor.colors.${value}`) }}
              </button>
            </template>
          </MdDropdown>

          <MdDropdown>
            <button
              type="button"
              :disabled="disabled"
              class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary disabled:opacity-40"
            >
              <MdIcon :icon="Underline" class="size-4" />
              {{ t('markdown.editor.toolbar.underline') }}
            </button>
            <template #menu="{ close }">
              <button
                v-for="(className, value) in MARKDOWN_UNDERLINE_COLORS"
                :key="value"
                type="button"
                role="menuitem"
                class="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                @click="applyTextStyle('underline', value); close()"
              >
                <span>{{ t(`markdown.editor.colors.${value}`) }}</span>
                <span class="markdown-text-underline font-semibold" :class="className">Aa</span>
              </button>
            </template>
          </MdDropdown>
        </div>
      </div>

      <div v-if="compact" class="order-2 flex items-center gap-2">
        <span v-if="maxLength" class="text-[11px] tabular-nums" :class="tooLong ? 'font-semibold text-danger' : 'text-faint'">{{ t('markdown.editor.count', { count: length, max: maxLength }) }}</span>
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors duration-150 ease-out"
          :class="compactPreview ? 'bg-primary text-on-primary' : 'text-body hover:bg-ghost-hover hover:text-primary'"
          :aria-pressed="compactPreview"
          @click="compactPreview = !compactPreview"
        >
          <MdIcon :icon="compactPreview ? Pencil : Eye" class="size-3.5" />
          {{ compactPreview ? t('markdown.editor.edit') : t('markdown.editor.preview') }}
        </button>
      </div>

      <MdDropdown
        v-else
        align="right"
        class="order-2 flex w-full items-center self-center md:w-auto md:justify-self-end md:border-l md:border-line md:pl-2"
        panel-class="w-[min(22rem,calc(100vw-1rem))] max-h-[min(22rem,calc(100vh-2rem))] overflow-y-auto p-1.5"
      >
        <button
          type="button"
          :disabled="disabled"
          class="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors duration-150 ease-out hover:bg-primary-strong disabled:opacity-40 md:w-auto"
        >
          <MdIcon :icon="Braces" class="size-4" />
          {{ t('markdown.editor.toolbar.advanced') }}
        </button>
        <template #menu="{ close }">
          <button
            v-for="definition in markdownContainers"
            :key="definition.name"
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors duration-150 ease-out hover:bg-ghost-hover focus:bg-ghost-hover focus:outline-none"
            @click="insertContainer(definition.name); close()"
          >
            <span class="grid size-8 shrink-0 place-items-center rounded-lg" :class="containerMenuMeta[definition.name].iconClass">
              <MdIcon :icon="containerMenuMeta[definition.name].icon" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex min-w-0 items-baseline gap-2">
                <span class="truncate text-[13px] font-semibold text-title">{{ t(definition.labelKey) }}</span>
                <span class="shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-faint">{{ containerMenuMeta[definition.name].englishLabel }}</span>
              </span>
              <span class="mt-0.5 block truncate text-[11px] leading-4 text-meta">{{ t(definition.descriptionKey) }}</span>
            </span>
          </button>
        </template>
      </MdDropdown>
    </div>

    <div v-if="mode === 'split' && !compact" class="flex shrink-0 border-b border-line bg-card p-1 md:hidden">
      <button
        v-for="pane in (['edit', 'preview'] as const)"
        :key="pane"
        type="button"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out"
        :class="mobilePane === pane ? 'bg-primary text-on-primary' : 'text-meta'"
        @click="mobilePane = pane"
      >
        <MdIcon :icon="pane === 'edit' ? Pencil : Eye" class="size-3.5" />
        {{ t(`markdown.editor.${pane}`) }}
      </button>
    </div>

    <div class="grid" :class="[mode === 'split' && !compact ? 'md:grid-cols-2 md:divide-x md:divide-line' : '', fill ? 'min-h-0 flex-1' : '']">
      <div
        ref="editorHost"
        class="min-w-0 bg-field"
        :class="[editorVisibility, fill ? 'h-full min-h-0 overflow-hidden' : '']"
      />
      <div
        class="overflow-y-auto bg-card"
        :class="[previewVisibility, compact ? 'min-h-24 p-3' : 'min-h-72 p-4', fill ? 'h-full min-h-0' : '', mode === 'preview' && !compact ? 'sm:px-8' : '']"
      >
        <RichContent v-if="preview.trim()" :content="preview" :env="previewEnv" format="markdown" :class="mode === 'preview' && !compact ? 'mx-auto max-w-3xl' : ''" />
        <div v-else class="grid place-items-center text-sm text-faint" :class="compact ? 'min-h-20' : 'min-h-64'">
          {{ t('markdown.editor.previewEmpty') }}
        </div>
      </div>
    </div>
    <div v-if="maxLength && !compact" class="flex shrink-0 justify-end border-t border-line bg-card px-3 py-1">
      <span class="text-[11px] tabular-nums" :class="tooLong ? 'font-semibold text-danger' : 'text-faint'">{{ t('markdown.editor.count', { count: length, max: maxLength }) }}</span>
    </div>
  </div>
  <input v-if="upload" ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFilesPicked">
  <p v-if="error" class="mt-1.5 text-xs font-medium text-danger">{{ error }}</p>
</template>
