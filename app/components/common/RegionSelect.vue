<template>
  <select
    :value="modelValue"
    class="select select-bordered w-full"
    v-bind="$attrs"
    @change="onchange"
  >
    <option value="">Select a region...</option>
    <option v-for="c in countries" :key="c.code" :value="c.name">
      {{ c.flag }} {{ c.name }}
    </option>
  </select>
</template>

<script setup>
import { getEmojiFlag, getCountryData, countries as allCountryCodes } from 'countries-list'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const onchange = (e) => {
  emit('update:modelValue', e.target.value)
}

// 主要国家列表（ISO 3166-1 alpha-2）
const mainCountryCodes = [
  // East Asia
  'JP', 'CN', 'KR', 'TW', 'HK',
  // Southeast Asia
  'TH', 'ID', 'MY', 'PH', 'VN', 'SG',
  // South Asia
  'IN',
  // North America
  'US', 'CA', 'MX',
  // Latin America
  'BR', 'AR', 'CO', 'CL',
  // Western Europe
  'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'PT', 'IE', 'BE', 'AT', 'CH',
  // Eastern Europe
  'RU', 'PL', 'UA', 'CZ',
  // Middle East
  'TR', 'IL', 'SA', 'AE',
  // Africa
  'NG', 'ZA', 'EG', 'KE',
  // Oceania
  'AU', 'NZ',
]

const countries = mainCountryCodes.map((code) => {
  const data = getCountryData(code)
  return {
    code,
    name: data.name,
    flag: getEmojiFlag(code),
  }
}).sort((a, b) => a.name.localeCompare(b.name))
</script>
