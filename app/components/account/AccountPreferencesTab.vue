<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">{{ t('account_pages.preferences.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('account_pages.preferences.description') }}</p>
      </div>

      <div v-if="isLoading" class="p-6 flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-gray-400"></span>
      </div>

      <template v-else>
        <div class="p-6 space-y-8">
          <!-- Region -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="region" class="text-sm font-medium text-gray-700">{{ t('account_pages.preferences.region') }}</label>
            <select
              id="region"
              v-model="form.region"
              class="select select-bordered w-full bg-white"
            >
              <option value="">{{ t('account_pages.preferences.select_region') }}</option>
              <option v-for="code in regionCodes" :key="code" :value="code">{{ regionName(code) }}</option>
            </select>
            <p class="text-xs text-gray-400">{{ t('account_pages.preferences.region_hint') }}</p>
          </div>

          <!-- Currency -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="currency" class="text-sm font-medium text-gray-700">{{ t('account_pages.preferences.currency') }}</label>
            <select
              id="currency"
              v-model="form.currency"
              class="select select-bordered w-full bg-white"
            >
              <option value="">{{ t('account_pages.preferences.select_currency') }}</option>
              <option v-for="code in currencyCodes" :key="code" :value="code">{{ currencyName(code) }} ({{ code }})</option>
            </select>
            <p class="text-xs text-gray-400">{{ t('account_pages.preferences.currency_hint') }}</p>
          </div>

          <!-- Language -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="language" class="text-sm font-medium text-gray-700">{{ t('account_pages.preferences.language') }}</label>
            <select
              id="language"
              v-model="form.locale"
              class="select select-bordered w-full bg-white"
            >
              <option value="">{{ t('account_pages.preferences.select_language') }}</option>
              <option v-for="code in languageCodes" :key="code" :value="code">{{ languageName(code) }}</option>
            </select>
            <p class="text-xs text-gray-400">{{ t('account_pages.preferences.language_hint') }}</p>
          </div>

          <!-- Gender -->
          <div class="grid gap-1.5 max-w-sm">
            <label class="text-sm font-medium text-gray-700">{{ t('account_pages.preferences.gender') }}</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="1"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">{{ t('account_pages.preferences.male') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="2"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">{{ t('account_pages.preferences.female') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="3"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">{{ t('account_pages.preferences.other') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="0"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">{{ t('account_pages.preferences.undisclosed') }}</span>
              </label>
            </div>
          </div>

          <!-- Adult content -->
          <div class="grid gap-1.5 max-w-sm">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-700">{{ t('account_pages.preferences.adult_content') }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ t('account_pages.preferences.adult_content_hint') }}</p>
              </div>
              <input
                v-model="form.show_adult_content"
                type="checkbox"
                class="toggle toggle-primary"
                :aria-label="t('account_pages.preferences.adult_content')"
              />
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
          <p v-if="statusMessage" :class="statusClass" class="text-xs font-medium">
            {{ statusMessage }}
          </p>
          <div v-else></div>
          <button
            type="button"
            class="btn btn-primary btn-sm gap-1.5"
            :disabled="isSaving || !hasChanges"
            @click="saveSettings"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
            <template v-else>
              <Save :size="14" />
              {{ t('account_pages.preferences.save') }}
            </template>
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { Save } from '@lucide/vue'

const emit = defineEmits(['save'])

const { $api } = useNuxtApp()
const { t } = useI18n()
const { regionName, currencyName, languageName } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()
const regionCodes = ['CN', 'HK', 'TW', 'US', 'JP', 'KR', 'SG']
const currencyCodes = ['CNY', 'HKD', 'TWD', 'USD', 'JPY', 'KRW', 'SGD', 'EUR']
const languageCodes = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']

const isLoading = ref(true)
const isSaving = ref(false)
const statusMessage = ref('')
const statusClass = ref('')

const form = reactive({
  region: '',
  currency: '',
  locale: '',
  gender: 0,
  show_adult_content: false
})

const original = ref({})

const hasChanges = computed(() => {
  const orig = original.value
  return form.region !== orig.region
    || form.currency !== orig.currency
    || form.locale !== orig.locale
    || form.gender !== orig.gender
    || form.show_adult_content !== orig.show_adult_content
})

const applySettings = (data) => {
  form.region = data.region || ''
  form.currency = data.currency || ''
  form.locale = data.locale || ''
  form.gender = data.gender ?? 0
  form.show_adult_content = !!data.show_adult_content
  original.value = { ...form }
}

const loadSettings = async () => {
  isLoading.value = true
  try {
    const data = await $api('/v1/me/settings')
    applySettings(data || {})
  } catch {
    // 首次未创建设置时可能 404，使用默认值
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  if (isSaving.value || !hasChanges.value) return

  isSaving.value = true
  statusMessage.value = ''

  try {
    await $api('/v1/me/settings', {
      method: 'PUT',
      body: {
        region: form.region || null,
        currency: form.currency || null,
        locale: form.locale || null,
        gender: form.gender,
        show_adult_content: form.show_adult_content
      }
    })

    original.value = { ...form }
    statusMessage.value = t('account_pages.preferences.saved')
    statusClass.value = 'text-emerald-600'
    emit('save', t('account_pages.preferences_saved'))
  } catch (error) {
    statusMessage.value = localizeError(error, 'account_pages.preferences.save_failed')
    statusClass.value = 'text-red-600'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
