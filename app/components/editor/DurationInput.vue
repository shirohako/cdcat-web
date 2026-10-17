<template>
  <input
    v-model="text"
    class="input input-sm w-[4.5rem] text-right font-mono tabular-nums"
    :class="{ 'input-error': invalid }"
    placeholder="0:00"
    inputmode="numeric"
    :aria-label="$t('catalog.field.duration')"
    @change="commit"
    @blur="commit"
  >
</template>

<script setup lang="ts">
import { formatDurationInput, parseDuration } from '~/utils/tracklistParser'

/** Seconds, typed as 3:45, 1:02:03 or the shorthand 345. */
const model = defineModel<number | null>({ required: true })
const text = ref('')
const invalid = ref(false)

watch(model, (value) => {
  text.value = formatDurationInput(value)
  invalid.value = false
}, { immediate: true })

const read = (value: string): number | null => {
  if (/^\d{1,2}$/.test(value)) return Number(value)
  if (/^\d{3,}$/.test(value)) {
    const seconds = Number(value.slice(-2))
    return seconds < 60 ? Number(value.slice(0, -2)) * 60 + seconds : null
  }
  if (/^\d+(?::[0-5]\d){1,2}$/.test(value)) return parseDuration(value)
  return null
}

const commit = () => {
  const value = text.value.trim()
  if (!value) {
    model.value = null
    invalid.value = false
    return
  }
  const seconds = read(value)
  invalid.value = seconds === null || seconds > 86400
  if (invalid.value) return
  model.value = seconds
  text.value = formatDurationInput(seconds)
}
</script>
