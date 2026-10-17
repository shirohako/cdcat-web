<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      v-model="text"
      class="input input-sm w-32 font-mono"
      :class="{ 'input-error': invalid }"
      :placeholder="$t('editor.date_placeholder')"
      inputmode="numeric"
      @change="commit"
      @blur="commit"
    >
    <span v-if="invalid" class="text-xs text-error">{{ $t('editor.date_invalid') }}</span>
    <span v-else-if="date" class="text-xs text-gray-400">{{ formatDate(date, precision) }}</span>
  </div>
</template>

<script setup lang="ts">
import type { DatePrecision } from '~/types/entry'

/** A date typed as 2024, 2024-05 or 2024-05-12; the precision follows from what was typed. */
const date = defineModel<string | null>('date', { required: true })
const precision = defineModel<DatePrecision>('precision', { default: 'day' })

const { formatDate } = useCatalogDisplay()
const text = ref('')
const invalid = ref(false)

const show = (value: string | null, level: DatePrecision) => !value ? '' : level === 'year' ? value.slice(0, 4) : level === 'month' ? value.slice(0, 7) : value.slice(0, 10)
watch([date, precision], () => {
  text.value = show(date.value, precision.value)
  invalid.value = false
}, { immediate: true })

const valid = (year: number, month: number, day: number) => {
  const value = new Date(Date.UTC(year, month - 1, day))
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day
}

const commit = () => {
  const value = text.value.trim()
  if (!value) {
    date.value = null
    invalid.value = false
    return
  }
  const match = value.match(/^(\d{4})(?:[-/.年](\d{1,2})(?:[-/.月](\d{1,2})日?)?月?)?年?$/)
  const [year, month, day] = [Number(match?.[1]), Number(match?.[2] ?? 1), Number(match?.[3] ?? 1)]
  if (!match || !valid(year, month, day)) {
    invalid.value = true
    return
  }
  invalid.value = false
  precision.value = match[3] ? 'day' : match[2] ? 'month' : 'year'
  date.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  text.value = show(date.value, precision.value)
}
</script>
