<template>
  <UiSelect
    :model-value="modelValue"
    :options="options"
    class="w-full"
    searchable
    :search-placeholder="$t('common.search_region')"
    v-bind="$attrs"
    @update:model-value="onchange"
  />
</template>

<script setup>
import { h } from 'vue'
import CommonFlag from '~/components/common/Flag.vue'

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

// Countries and regions with a flag in public/flags (ISO 3166-1 alpha-2): about 5 million people or more and a real online
// music market, plus Macau and Puerto Rico, and EU for releases made for all of Europe. The two lists are kept the same;
// a code added here needs its flag there. Grouped by continent (names in English, like the regions): the Middle East is
// in Asia, Mexico, Central America and the Caribbean in North America.
const REGION_GROUPS = {
  Asia: ['JP', 'CN', 'KR', 'TW', 'HK', 'MO', 'TH', 'ID', 'MY', 'PH', 'VN', 'SG', 'IN', 'PK', 'BD', 'LK', 'KZ', 'UZ', 'TR', 'IL', 'SA', 'AE', 'IR', 'IQ', 'JO', 'LB'],
  Europe: ['EU', 'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'AT', 'CH', 'IT', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'RS', 'UA', 'BY', 'RU'],
  'North America': ['US', 'CA', 'MX', 'GT', 'CR', 'DO', 'PR'],
  'South America': ['BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO'],
  'Africa': ['EG', 'MA', 'DZ', 'TN', 'NG', 'GH', 'KE', 'TZ', 'ZA'],
  'Oceania': ['AU', 'NZ'],
}

// The value is the ISO code itself ("JP"); the label is always the English name, whatever the UI language. Groups keep
// the order above; inside a group the names are alphabetical (Europe, the EU entry, stays first).
const countries = Object.entries(REGION_GROUPS).flatMap(([group, codes]) => codes
  .map(code => ({ code, group, name: regionEnglishName(code) }))
  .sort((a, b) => (a.code === 'EU' ? -1 : b.code === 'EU' ? 1 : a.name.localeCompare(b.name, 'en'))))

const { t } = useI18n()
const { regionName } = useLocaleFormatting()

const options = computed(() => [
  { value: '', label: t('account_pages.preferences.select_region') },
  // Flags are images (public/flags), not emoji: Windows shows emoji flags as two letters.
  ...countries.map(c => ({ value: c.code, label: c.name, group: c.group, keywords: `${c.code} ${regionName(c.code)}`, icon: () => h(CommonFlag, { code: c.code }) })),
])
</script>
