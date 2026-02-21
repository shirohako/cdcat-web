<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">偏好设置</h2>
        <p class="text-sm text-gray-500 mt-1">自定义你的账户偏好和个人信息</p>
      </div>

      <div v-if="isLoading" class="p-6 flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-gray-400"></span>
      </div>

      <template v-else>
        <div class="p-6 space-y-8">
          <!-- Region -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="region" class="text-sm font-medium text-gray-700">账户地区</label>
            <select
              id="region"
              v-model="form.region"
              class="select select-bordered w-full bg-white"
            >
              <option value="">选择地区</option>
              <option value="CN">中国</option>
              <option value="HK">香港</option>
              <option value="TW">台湾</option>
              <option value="US">美国</option>
              <option value="JP">日本</option>
              <option value="KR">韩国</option>
              <option value="SG">新加坡</option>
            </select>
            <p class="text-xs text-gray-400">用于展示地区相关内容和价格</p>
          </div>

          <!-- Currency -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="currency" class="text-sm font-medium text-gray-700">货币</label>
            <select
              id="currency"
              v-model="form.currency"
              class="select select-bordered w-full bg-white"
            >
              <option value="">选择货币</option>
              <option value="CNY">人民币（CNY）</option>
              <option value="HKD">港币（HKD）</option>
              <option value="TWD">新台币（TWD）</option>
              <option value="USD">美元（USD）</option>
              <option value="JPY">日元（JPY）</option>
              <option value="KRW">韩元（KRW）</option>
              <option value="SGD">新加坡元（SGD）</option>
              <option value="EUR">欧元（EUR）</option>
            </select>
            <p class="text-xs text-gray-400">用于价格显示（默认会跟随地区）</p>
          </div>

          <!-- Language -->
          <div class="grid gap-1.5 max-w-sm">
            <label for="language" class="text-sm font-medium text-gray-700">首选语言</label>
            <select
              id="language"
              v-model="form.locale"
              class="select select-bordered w-full bg-white"
            >
              <option value="">选择语言</option>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
            <p class="text-xs text-gray-400">界面和内容将使用此语言显示</p>
          </div>

          <!-- Gender -->
          <div class="grid gap-1.5 max-w-sm">
            <label class="text-sm font-medium text-gray-700">性别</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="1"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">男</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="2"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">女</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="3"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">其他</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model.number="form.gender"
                  type="radio"
                  :value="0"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm text-gray-700">不透露</span>
              </label>
            </div>
          </div>

          <!-- Adult content -->
          <div class="grid gap-1.5 max-w-sm">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-700">显示成人内容</p>
                <p class="text-xs text-gray-400 mt-0.5">开启后可能会看到 18+ / 成人向内容</p>
              </div>
              <input
                v-model="form.show_adult_content"
                type="checkbox"
                class="toggle toggle-primary"
                aria-label="显示成人内容"
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
              保存设置
            </template>
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { Save } from 'lucide-vue-next'

const emit = defineEmits(['save'])

const { $api } = useNuxtApp()

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
    statusMessage.value = '设置已保存'
    statusClass.value = 'text-emerald-600'
    emit('save', '偏好设置已保存')
  } catch (error) {
    statusMessage.value = error?.message || '保存失败，请稍后重试'
    statusClass.value = 'text-red-600'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
