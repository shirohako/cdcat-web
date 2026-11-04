<script lang="ts">
import type { UiSelectValue } from './Select.vue'
import { Check } from '@lucide/vue'

const TONES = {
  blue: {
    idle: 'border-blue-100 enabled:hover:border-blue-300 enabled:hover:bg-blue-50/40 dark:border-blue-400/20 dark:enabled:hover:border-blue-400/50 dark:enabled:hover:bg-blue-400/10',
    chosen: 'border-blue-400 bg-blue-50 dark:bg-blue-400/15',
    title: 'text-blue-600 dark:text-blue-300',
    summary: 'text-blue-400',
    check: 'border-blue-400 bg-blue-400',
    divider: 'border-blue-100 dark:border-blue-400/20',
    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
  },
  violet: {
    idle: 'border-violet-100 enabled:hover:border-violet-300 enabled:hover:bg-violet-50/40 dark:border-violet-400/20 dark:enabled:hover:border-violet-400/50 dark:enabled:hover:bg-violet-400/10',
    chosen: 'border-violet-400 bg-violet-50 dark:bg-violet-400/15',
    title: 'text-violet-600 dark:text-violet-300',
    summary: 'text-violet-400',
    check: 'border-violet-400 bg-violet-400',
    divider: 'border-violet-100 dark:border-violet-400/20',
    badge: 'bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  },
  pink: {
    idle: 'border-pink-100 enabled:hover:border-pink-300 enabled:hover:bg-pink-50/40 dark:border-pink-400/20 dark:enabled:hover:border-pink-400/50 dark:enabled:hover:bg-pink-400/10',
    chosen: 'border-pink-400 bg-pink-50 dark:bg-pink-400/15',
    title: 'text-pink-600 dark:text-pink-300',
    summary: 'text-pink-400',
    check: 'border-pink-400 bg-pink-400',
    divider: 'border-pink-100 dark:border-pink-400/20',
    badge: 'bg-pink-100 text-pink-600 dark:bg-pink-400/15 dark:text-pink-300',
  },
  amber: {
    idle: 'border-amber-100 enabled:hover:border-amber-300 enabled:hover:bg-amber-50/40 dark:border-amber-400/20 dark:enabled:hover:border-amber-400/50 dark:enabled:hover:bg-amber-400/10',
    chosen: 'border-amber-400 bg-amber-50 dark:bg-amber-400/15',
    title: 'text-amber-600 dark:text-amber-300',
    summary: 'text-amber-400',
    check: 'border-amber-400 bg-amber-400',
    divider: 'border-amber-100 dark:border-amber-400/20',
    badge: 'bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
  purple: {
    idle: 'border-purple-100 enabled:hover:border-purple-300 enabled:hover:bg-purple-50/40 dark:border-purple-400/20 dark:enabled:hover:border-purple-400/50 dark:enabled:hover:bg-purple-400/10',
    chosen: 'border-purple-400 bg-purple-50 dark:bg-purple-400/15',
    title: 'text-purple-600 dark:text-purple-300',
    summary: 'text-purple-400',
    check: 'border-purple-400 bg-purple-400',
    divider: 'border-purple-100 dark:border-purple-400/20',
    badge: 'bg-purple-100 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
  },
  teal: {
    idle: 'border-teal-100 enabled:hover:border-teal-300 enabled:hover:bg-teal-50/40 dark:border-teal-400/20 dark:enabled:hover:border-teal-400/50 dark:enabled:hover:bg-teal-400/10',
    chosen: 'border-teal-400 bg-teal-50 dark:bg-teal-400/15',
    title: 'text-teal-600 dark:text-teal-300',
    summary: 'text-teal-400',
    check: 'border-teal-400 bg-teal-400',
    divider: 'border-teal-100 dark:border-teal-400/20',
    badge: 'bg-teal-100 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300',
  },
}

const SPANS = { 2: 'md:col-span-2', 3: 'md:col-span-3', 6: 'md:col-span-6' }

export interface UiDialogSelectOption<V extends UiSelectValue = UiSelectValue> {
  value: V
  label: string
  /** Dim text after the label, e.g. the English name. */
  hint?: string
  /** One line under the label. */
  summary?: string
  /** What choosing this option means. */
  description: string
  /** What the option covers, as a list. */
  content?: string[]
  /** Columns out of six on wider screens; a full row sets its description and content side by side. */
  span?: keyof typeof SPANS
  tone?: keyof typeof TONES
  disabled?: boolean
}
</script>

<script setup lang="ts" generic="T extends UiSelectValue">
/**
 * A select for options that need explaining: it looks like UiSelect, but the field opens a dialog of coloured blocks,
 * each with an option's name, what it means and what it covers. Each row of the grid adds up to six columns (see
 * `span`). A pick applies and closes; closing without one keeps the value. In the dialog the arrow keys move between
 * blocks and Enter or Space picks. Attributes (class, id, aria-label …) go to the button.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  options: UiDialogSelectOption<T>[]
  /** The dialog's title, also the name of its group of options. */
  title: string
  description?: string
  placeholder?: string
  size?: 'xs' | 'sm' | 'md'
  invalid?: boolean
  disabled?: boolean
}>(), { description: undefined, placeholder: '', size: 'md' })

const model = defineModel<T>()

const SIZES = { xs: 'select-xs', sm: 'select-sm', md: '' }
const STEPS: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

const open = ref(false)

const selected = computed(() => props.options.find(option => option.value === model.value) ?? null)
/** Where focus lands when the dialog opens. */
const first = computed(() => selected.value ?? props.options.find(option => !option.disabled) ?? null)
const blocks = computed(() => props.options.map(option => ({
  option,
  chosen: option === selected.value,
  tone: TONES[option.tone ?? 'blue'],
})))

const pick = (option: UiDialogSelectOption<T>) => {
  model.value = option.value
  open.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  const by = STEPS[event.key]
  if (!by) return
  event.preventDefault()
  const enabled = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:enabled')]
  const index = enabled.indexOf(event.target as HTMLElement)
  enabled[(index + by + enabled.length) % enabled.length]?.focus()
}
</script>

<template>
  <button
    type="button"
    v-bind="$attrs"
    class="select inline-flex items-center gap-2 bg-none pr-2.5 text-left"
    :class="[SIZES[size], { 'select-error': invalid }]"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-invalid="invalid || undefined"
    :disabled="disabled"
    @click="open = true"
  >
    <span class="min-w-0 flex-1 truncate" :class="{ 'text-faint': !selected }">{{ selected?.label ?? placeholder }}</span>
    <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-meta" />
  </button>

  <UiDialog v-model="open" size="lg" :title="title" :description="description">
    <div role="radiogroup" :aria-label="title" class="grid grid-cols-1 gap-2 md:grid-cols-6" @keydown="onKeydown">
      <button
        v-for="{ option, chosen, tone } in blocks"
        :key="String(option.value)"
        type="button"
        role="radio"
        :aria-checked="chosen"
        :data-autofocus="option === first || undefined"
        :disabled="option.disabled"
        class="flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
        :class="[SPANS[option.span ?? 2], chosen ? [tone.chosen, 'shadow-sm'] : tone.idle]"
        @click="pick(option)"
      >
        <span class="flex w-full items-center justify-between gap-2">
          <span class="min-w-0">
            <span class="block text-sm font-bold leading-tight" :class="chosen ? tone.title : 'text-title'">
              {{ option.label }}<span v-if="option.hint" class="ml-1.5 font-normal opacity-60">{{ option.hint }}</span>
            </span>
            <span v-if="option.summary" class="mt-0.5 block text-xs" :class="chosen ? tone.summary : 'text-meta'">{{ option.summary }}</span>
          </span>
          <span class="flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-all" :class="chosen ? tone.check : 'border-faint'" aria-hidden="true">
            <Check v-if="chosen" :size="10" :stroke-width="3" class="text-white" />
          </span>
        </span>

        <span class="w-full border-t pt-2" :class="[chosen ? tone.divider : 'border-line', option.span === 6 ? 'space-y-2 md:grid md:grid-cols-[minmax(0,1fr)_14rem] md:gap-6 md:space-y-0' : 'space-y-2']">
          <span class="block">
            <span class="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider" :class="chosen ? tone.badge : 'bg-sunken text-meta'">{{ $t('common.option_description') }}</span>
            <span class="block text-xs leading-5" :class="chosen ? 'text-body' : 'text-meta'">{{ option.description }}</span>
          </span>
          <span v-if="option.content?.length" class="block">
            <span class="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider" :class="chosen ? tone.badge : 'bg-sunken text-meta'">{{ $t('common.option_content') }}</span>
            <span class="flex flex-wrap gap-x-3 gap-y-1">
              <span v-for="item in option.content" :key="item" class="flex items-start gap-1.5 text-xs" :class="chosen ? 'text-body' : 'text-meta'">
                <span class="mt-0.5 size-1 shrink-0 translate-y-0.75 rounded-full bg-current opacity-50" />
                <span>{{ item }}</span>
              </span>
            </span>
          </span>
        </span>
      </button>
    </div>
  </UiDialog>
</template>
