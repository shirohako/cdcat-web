<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      v-model="text"
      class="input input-sm w-32 font-mono"
      :class="{ 'input-error': invalid }"
      :aria-invalid="invalid || undefined"
      :placeholder="$t('editor.date_placeholder')"
      @input="onInput"
      @change="commit"
      @blur="commit"
    >
    <span v-if="invalid" class="text-xs text-danger">{{ $t('editor.date_invalid') }}</span>
  </div>
</template>

<script setup lang="ts">
import type { DatePrecision } from '~/types/entry'

/**
 * A date typed as 2024, 2024-05 or 2024-05-12, or pasted as Nov 06, 2026 (parseDateText); on leaving the field or on a
 * paste it turns into the first form, or marks the field. The precision follows from what was typed.
 *
 * `rejected` is the text that could not be read while the field is marked; `date` keeps its last good value then. An
 * editor binds it to refuse to submit, and because the field may unmount while the text waits for a fix.
 */
const date = defineModel<string | null>('date', { required: true })
const precision = defineModel<DatePrecision>('precision', { default: 'day' })
const rejected = defineModel<string | null>('rejected', { default: null })

const invalid = computed(() => rejected.value !== null)

const show = (value: string | null, level: DatePrecision) => !value ? '' : level === 'year' ? value.slice(0, 4) : level === 'month' ? value.slice(0, 7) : value.slice(0, 10)
const text = ref(rejected.value ?? show(date.value, precision.value))
watch([date, precision], () => {
  text.value = show(date.value, precision.value)
  rejected.value = null
})

const commit = () => {
  const value = text.value.trim()
  if (!value) {
    date.value = null
    rejected.value = null
    return
  }
  const parsed = parseDateText(value)
  if (!parsed) {
    rejected.value = value
    return
  }
  rejected.value = null
  precision.value = parsed.precision
  date.value = parsed.date
  text.value = show(parsed.date, parsed.precision)
}

/** Fixing a marked date clears the mark; a pasted date needs no leaving the field first. */
const onInput = (event: Event) => {
  rejected.value = null
  if ((event as InputEvent).inputType === 'insertFromPaste') commit()
}
</script>
