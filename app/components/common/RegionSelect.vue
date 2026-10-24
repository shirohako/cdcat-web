<template>
  <UiSelect
    :model-value="modelValue"
    :options="options"
    class="w-full"
    v-bind="$attrs"
    @update:model-value="onchange"
  />
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

const onchange = (value) => {
  emit('update:modelValue', value)
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

const { regionName } = useLocaleFormatting()

const countries = computed(() => mainCountryCodes.map((code) => {
  const data = getCountryData(code)
  return {
    code,
    name: regionName(code),
    value: data.name,
    flag: getEmojiFlag(code),
  }
}).sort((a, b) => a.name.localeCompare(b.name)))

const { t } = useI18n()

const options = computed(() => [
  { value: '', label: t('account_pages.preferences.select_region') },
  ...countries.value.map(c => ({ value: c.value, label: `${c.flag} ${c.name}` })),
])
</script>
