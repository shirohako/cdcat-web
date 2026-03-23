<template>
  <div class="space-y-6">
    <CommonConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      @confirm="confirmDialog.onConfirm"
    />
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Products</h2>
        <button type="button" class="btn btn-sm btn-primary gap-1" @click="addProduct">
          <Plus :size="14" />
          Add Product
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        管理作品的不同发行版本（初回限定版、通常版等）。每个版本对应一个 Product 条目。
      </p>
    </div>

    <!-- 空状态 -->
    <div
      v-if="formData.products.length === 0"
      class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 gap-2"
    >
      <PackageOpen :size="32" class="opacity-40" />
      <p class="text-sm">暂无产品版本</p>
    </div>

    <!-- 产品列表 -->
    <div
      v-for="(product, index) in formData.products"
      :key="product.id"
      class="border border-gray-200 rounded-xl overflow-hidden"
    >
      <!-- 卡片标题栏 -->
      <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-white bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
            {{ index + 1 }}
          </span>
          <span class="text-sm font-semibold text-gray-700">
            {{ product.name || product.edition_type || 'Product' }}
          </span>
          <span v-if="product.catalog_number" class="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {{ product.catalog_number }}
          </span>
          <span v-if="product.edition_type === 'LIMITED'" class="badge badge-xs badge-warning gap-1">
            <Lock :size="9" />
            限定
          </span>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-ghost text-gray-400 hover:text-error hover:bg-error/10"
          @click="removeProduct(index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <div class="p-4 space-y-5">
        <!-- § 版本信息 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
              <Tag :size="11" />
              版本信息
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Edition Type（版本类型）</span>
              </label>
              <select v-model="product.edition_type" class="select select-bordered select-sm w-full">
                <option value="REGULAR">Regular（通常版）</option>
                <option value="LIMITED">Limited（限定版）</option>
              </select>
            </div>
            <div class="form-control md:col-span-2">
              <label class="label py-1">
                <span class="label-text font-semibold">Name（产品名称）</span>
              </label>
              <input
                v-model="product.name"
                type="text"
                placeholder="e.g. 初回生産限定盤A、完全生産限定盤"
                class="input input-bordered input-sm w-full"
              />
            </div>
          </div>
        </div>

        <!-- § 限定信息（仅 LIMITED 显示） -->
        <div v-if="product.edition_type === 'LIMITED'" class="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-3">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              <Lock :size="11" />
              限定信息
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Limited Rule（限定规则）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <select v-model="product.limited_rule" class="select select-bordered select-sm w-full bg-white">
                <option value="">-- 请选择限定规则 --</option>
                <option value="FIRST_PRESS">First Press（初回限定）</option>
                <option value="COUNT">Count（数量限定）</option>
                <option value="PERIOD">Period（期间限定）</option>
                <option value="SHOP">Shop（店铺限定）</option>
                <option value="EVENT">Event（活动限定）</option>
                <option value="REGION">Region（地区限定）</option>
              </select>
            </div>
            <div class="form-control md:col-span-2">
              <label class="label py-1">
                <span class="label-text font-semibold">Limited Name（限定备注）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <input
                v-model="product.limited_name"
                type="text"
                placeholder="e.g. Amazon.co.jp 限定 メガジャケ付、C86 限定"
                class="input input-bordered input-sm w-full bg-white"
              />
            </div>
          </div>
        </div>

        <!-- § 发售信息 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
              <CalendarDays :size="11" />
              发售信息
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Release Date（发售日期）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <input
                v-model="product.release_date"
                type="date"
                class="input input-bordered input-sm w-full"
              />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Catalog Number（品番）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <input
                v-model="product.catalog_number"
                type="text"
                placeholder="e.g. SRCL-9999"
                class="input input-bordered input-sm w-full"
              />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Barcode（条形码）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <input
                v-model="product.barcode"
                type="text"
                placeholder="e.g. 4988013812345"
                class="input input-bordered input-sm w-full"
              />
            </div>
          </div>
        </div>

        <!-- § 介质与格式 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-600">
              <Disc3 :size="11" />
              介质与格式
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Medium（载体）</span>
              </label>
              <select v-model="product.medium" class="select select-bordered select-sm w-full">
                <option value="PHYSICAL">Physical（实体版）</option>
                <option value="DIGITAL">Digital（数字版）</option>
              </select>
            </div>
            <div class="form-control md:col-span-2">
              <label class="label py-1">
                <span class="label-text font-semibold">Format（格式）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <input
                v-model="product.format"
                type="text"
                placeholder="e.g. 2CD + DVD、CD + Blu-ray"
                class="input input-bordered input-sm w-full"
              />
              <p class="text-xs text-gray-400 mt-1">仅实体版填写，数字版可留空。</p>
            </div>
          </div>
        </div>

        <!-- § 价格 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
              <Banknote :size="11" />
              价格
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Currency（货币）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
              </label>
              <select v-model="product.currency" class="select select-bordered select-sm w-full font-mono">
                <option value="">-- 无价格信息 --</option>
                <option v-for="c in currencyOptions" :key="c.code" :value="c.code">
                  {{ c.code }} – {{ c.name }}
                </option>
              </select>
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold">Price（价格）</span>
              </label>
              <input
                v-model="product.price"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                :disabled="!product.currency"
                class="input input-bordered input-sm w-full disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <!-- § 封面图 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
              <ImageIcon :size="11" />
              封面图
            </span>
          </div>
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-semibold">Cover Image URL（封面图）<span class="font-normal text-gray-400 text-xs ml-1">Optional</span></span>
            </label>
            <input
              v-model="product.image_url"
              type="text"
              placeholder="https://..."
              class="input input-bordered input-sm w-full"
            />
          </div>
        </div>

        <!-- § 其他设置 -->
        <div>
          <div class="flex items-center gap-1.5 mb-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              <SlidersHorizontal :size="11" />
              其他设置
            </span>
          </div>
          <div class="space-y-2">
            <div>
              <label class="label cursor-pointer justify-start gap-3 py-1">
                <input v-model="product.is_hires" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                <span class="label-text font-semibold">Hi-Res Audio（高解析度音频）</span>
              </label>
              <p class="text-xs text-gray-400 ml-7">采样率 ≥ 96kHz / 位深 ≥ 24bit 的高品质音频格式，如 FLAC Hi-Res、MQA 等。</p>
            </div>
            <div>
              <label class="label cursor-pointer justify-start gap-3 py-1">
                <input v-model="product.is_available" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                <span class="label-text font-semibold">Available（是否还在贩卖）</span>
              </label>
              <p class="text-xs text-gray-400 ml-7">如果该版本已经停售或绝版，请不要勾选。</p>
            </div>
            <div class="form-control w-32 pt-1">
              <label class="label py-1">
                <span class="label-text font-semibold">Sort Order（排序）</span>
              </label>
              <input
                v-model="product.sort_order"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="input input-bordered input-sm w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, PackageOpen, Tag, Lock, CalendarDays, Disc3, Banknote, Image as ImageIcon, SlidersHorizontal } from 'lucide-vue-next'
import { getCountryDataList } from 'countries-list'

export interface Product {
  id: string
  product_id?: number
  name: string
  edition_type: string
  limited_rule: string
  limited_name: string
  release_date: string
  catalog_number: string
  barcode: string
  is_available: boolean
  medium: string
  format: string
  is_hires: boolean
  price: string
  currency: string
  image_url: string
  sort_order: string
}

interface FormData {
  products: Product[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

// 从 countries-list 提取去重排序的货币列表，优先展示常用货币
const PRIORITY_CURRENCIES = ['JPY', 'USD', 'EUR', 'KRW', 'CNY', 'TWD', 'HKD', 'GBP', 'AUD', 'CAD']
const displayNames = new Intl.DisplayNames(['zh-Hans'], { type: 'currency' })

const allCurrencyCodes = [...new Set(
  getCountryDataList().flatMap(c => c.currency),
)].sort()

const currencyOptions = [
  ...PRIORITY_CURRENCIES.filter(c => allCurrencyCodes.includes(c)),
  ...allCurrencyCodes.filter(c => !PRIORITY_CURRENCIES.includes(c)),
].map(code => ({
  code,
  name: (() => { try { return displayNames.of(code) ?? code } catch { return code } })(),
}))

let productIdCounter = 0

const addProduct = () => {
  const newProducts = [
    ...props.formData.products,
    {
      id: `product-${productIdCounter++}`,
      product_id: undefined,
      name: '',
      edition_type: 'REGULAR',
      limited_rule: '',
      limited_name: '',
      release_date: '',
      catalog_number: '',
      barcode: '',
      is_available: true,
      medium: 'PHYSICAL',
      format: '',
      is_hires: false,
      price: '',
      currency: '',
      image_url: '',
      sort_order: '0',
    },
  ]
  emit('update:formData', { ...props.formData, products: newProducts })
}

const confirmDialog = reactive({
  show: false,
  title: '',
  description: '',
  onConfirm: () => {},
})

const removeProduct = (index: number) => {
  const name = props.formData.products[index]?.name || `Product ${index + 1}`
  confirmDialog.title = `删除「${name}」`
  confirmDialog.description = '此操作不可撤销，确认删除该版本规格？'
  confirmDialog.onConfirm = () => {
    const newProducts = props.formData.products.filter((_, i) => i !== index)
    emit('update:formData', { ...props.formData, products: newProducts })
  }
  confirmDialog.show = true
}
</script>
