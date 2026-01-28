<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">偏好设置</h2>
        <p class="text-sm text-gray-500 mt-1">自定义你的账户偏好和个人信息</p>
      </div>

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
            <option value="OTHER">其他</option>
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
            v-model="form.language"
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

        <!-- Birth year -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="birth-year" class="text-sm font-medium text-gray-700">出生年份</label>
          <input
            id="birth-year"
            v-model="form.birthYear"
            type="number"
            inputmode="numeric"
            class="input input-bordered w-full bg-white"
            :min="1900"
            :max="currentYear"
            placeholder="例如：1995"
            @blur="normalizeBirthYear"
          />
          <p class="text-xs text-gray-400">用于个性化推荐（可不填写）</p>
        </div>

        <!-- Adult content -->
        <div class="grid gap-1.5 max-w-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-700">显示成人内容</p>
              <p class="text-xs text-gray-400 mt-0.5">开启后可能会看到 18+ / 成人向内容</p>
            </div>
            <input
              v-model="form.showAdultContent"
              type="checkbox"
              class="toggle toggle-primary"
              aria-label="显示成人内容"
            />
          </div>
        </div>

        <!-- Gender -->
        <div class="grid gap-1.5 max-w-sm">
          <label class="text-sm font-medium text-gray-700">性别</label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.gender"
                type="radio"
                value="male"
                class="radio radio-sm radio-primary"
              />
              <span class="text-sm text-gray-700">男</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.gender"
                type="radio"
                value="female"
                class="radio radio-sm radio-primary"
              />
              <span class="text-sm text-gray-700">女</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.gender"
                type="radio"
                value="prefer-not"
                class="radio radio-sm radio-primary"
              />
              <span class="text-sm text-gray-700">不透露</span>
            </label>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end">
        <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="$emit('save')">
          <Save :size="14" />
          保存设置
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Save } from 'lucide-vue-next'

const props = defineProps({
  user: { type: Object, default: null }
})

defineEmits(['save'])

const defaultCurrencyForRegion = (region) => {
  const map = {
    CN: 'CNY',
    HK: 'HKD',
    TW: 'TWD',
    US: 'USD',
    JP: 'JPY',
    KR: 'KRW',
    SG: 'SGD',
    OTHER: 'USD'
  }
  return map[region] || 'USD'
}

const form = reactive({
  region: props.user?.region || '',
  currency: props.user?.currency || defaultCurrencyForRegion(props.user?.region),
  language: props.user?.language || 'zh-CN',
  birthYear: props.user?.birthYear || (typeof props.user?.age === 'number' ? String(props.user?.age) : ''),
  showAdultContent: !!props.user?.showAdultContent,
  gender: props.user?.gender === 'other' ? 'prefer-not' : (props.user?.gender || '')
})

const currentYear = new Date().getFullYear()

watch(
  () => form.region,
  (newRegion, oldRegion) => {
    const oldDefault = defaultCurrencyForRegion(oldRegion)
    const newDefault = defaultCurrencyForRegion(newRegion)
    if (!form.currency || form.currency === oldDefault) {
      form.currency = newDefault
    }
  }
)

const normalizeBirthYear = () => {
  const raw = String(form.birthYear || '').trim()
  if (!raw) {
    form.birthYear = ''
    return
  }

  const year = Number.parseInt(raw, 10)
  if (!Number.isFinite(year)) {
    form.birthYear = ''
    return
  }

  const clamped = Math.min(Math.max(year, 1900), currentYear)
  form.birthYear = String(clamped)
}
</script>
