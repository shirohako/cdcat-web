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
        <h2 class="text-xl font-bold text-gray-900">Bonuses</h2>
        <button type="button" class="btn btn-sm btn-primary gap-1" @click="addBonus">
          <Plus :size="14" />
          Add Bonus
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        管理作品的特典信息（特典曲、写真集、海报等）。
      </p>
    </div>

    <!-- 空状态 -->
    <div
      v-if="formData.bonuses.length === 0"
      class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 gap-2"
    >
      <Gift :size="32" class="opacity-40" />
      <p class="text-sm">暂无特典信息</p>
    </div>

    <!-- 特典列表 -->
    <div
      v-for="(bonus, index) in formData.bonuses"
      :key="bonus.id"
      class="border border-gray-200 rounded-xl p-4 space-y-3"
    >
      <!-- 卡片标题栏 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-white bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
            {{ index + 1 }}
          </span>
          <span class="text-sm font-semibold text-gray-700">
            {{ bonus.name || '(unnamed bonus)' }}
          </span>
          <span v-if="bonus.type" class="badge badge-sm badge-ghost">{{ bonus.type }}</span>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-ghost text-gray-400 hover:text-error hover:bg-error/10"
          @click="removeBonus(index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <!-- 字段 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Bonus Type -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Type <span class="text-red-500">*</span></span>
          </label>
          <select v-model="bonus.type" class="select select-bordered select-sm w-full">
            <option value="">-- 请选择特典类型 --</option>
            <option value="BONUS_TRACK">Bonus Track（配信/收录加曲）</option>
            <option value="BONUS_DISC">Bonus Disc（特典碟片）</option>
            <option value="BOOKLET">Booklet（小册子/歌词本/设定册）</option>
            <option value="PHOTO_ITEM">Photo Item（生写/卡片/海报等）</option>
            <option value="GOODS">Goods（亚克力/徽章/钥匙扣等周边）</option>
            <option value="DIGITAL_CONTENT">Digital Content（数字内容下载）</option>
            <option value="SERIAL_CODE">Serial Code（序列号）</option>
            <option value="EVENT_ENTRY">Event Entry（活动参加券/应募券）</option>
            <option value="SIGNED_ITEM">Signed Item（签名类特典）</option>
            <option value="OTHER">Other（其他）</option>
          </select>
        </div>

        <!-- Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Name <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="bonus.name"
            type="text"
            placeholder="特典名称"
            class="input input-bordered input-sm w-full"
          />
        </div>

        <!-- Image URL -->
        <div class="form-control md:col-span-2">
          <label class="label">
            <span class="label-text font-semibold">Image URL <span class="font-normal text-gray-400">(Optional)</span></span>
          </label>
          <input
            v-model="bonus.image_url"
            type="text"
            placeholder="https://..."
            class="input input-bordered input-sm w-full"
          />
        </div>
      </div>

      <!-- Description -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Description <span class="font-normal text-gray-400">(Optional)</span></span>
        </label>
        <textarea
          v-model="bonus.description"
          placeholder="特典说明"
          class="textarea textarea-bordered textarea-sm w-full resize-none"
          rows="2"
        />
      </div>

      <!-- is_digital -->
      <div>
        <label class="label cursor-pointer justify-start gap-3 py-1">
          <input v-model="bonus.is_digital" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
          <span class="label-text font-semibold">Digital（下载特典）</span>
        </label>
        <p class="text-xs text-gray-400 ml-7">该特典为数字下载内容（如 DL 特典、数字壁纸等）。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, Gift } from 'lucide-vue-next'

export interface Bonus {
  id: string
  bonus_id?: number
  type: string
  name: string
  description: string
  is_digital: boolean
  image_url: string
}

interface FormData {
  bonuses: Bonus[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

let bonusIdCounter = 0

const addBonus = () => {
  const newBonuses = [
    ...props.formData.bonuses,
    {
      id: `bonus-${bonusIdCounter++}`,
      bonus_id: undefined,
      type: '',
      name: '',
      description: '',
      is_digital: false,
      image_url: '',
    },
  ]
  emit('update:formData', { ...props.formData, bonuses: newBonuses })
}

const confirmDialog = reactive({
  show: false,
  title: '',
  description: '',
  onConfirm: () => {},
})

const removeBonus = (index: number) => {
  const name = props.formData.bonuses[index]?.name || `Bonus ${index + 1}`
  confirmDialog.title = `删除「${name}」`
  confirmDialog.description = '此操作不可撤销，确认删除该特典？'
  confirmDialog.onConfirm = () => {
    const newBonuses = props.formData.bonuses.filter((_, i) => i !== index)
    emit('update:formData', { ...props.formData, bonuses: newBonuses })
  }
  confirmDialog.show = true
}
</script>
