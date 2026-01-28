<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-gray-900">收货地址</h2>
          <p class="text-sm text-gray-500 mt-1">管理你的收货地址</p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          @click="showAddForm = true"
        >
          <Plus :size="14" />
          添加地址
        </button>
      </div>

      <!-- Address List -->
      <div v-if="addresses.length > 0" class="divide-y divide-gray-100">
        <div
          v-for="(address, index) in addresses"
          :key="index"
          class="p-6 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-medium text-gray-900">{{ address.name }}</h3>
              <span v-if="address.isDefault" class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                默认地址
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-1">
              {{ address.province }}{{ address.city }}{{ address.district }}{{ address.address }}
            </p>
            <p class="text-sm text-gray-500">
              {{ address.name }} · {{ address.phone }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              @click="editAddress(index)"
            >
              编辑
            </button>
            <button
              type="button"
              class="text-sm text-red-600 hover:text-red-700 transition-colors"
              @click="deleteAddress(index)"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="p-12 text-center">
        <MapPin :size="32" class="mx-auto text-gray-400 mb-3" />
        <p class="text-gray-500 mb-4">还没有收货地址</p>
        <button
          type="button"
          class="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          @click="showAddForm = true"
        >
          立即添加
        </button>
      </div>
    </section>

    <!-- Add/Edit Form Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAddForm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          @click.self="closeForm"
        >
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="scale-95 opacity-0"
            enter-to-class="scale-100 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="scale-100 opacity-100"
            leave-to-class="scale-95 opacity-0"
          >
            <div v-if="showAddForm" class="bg-white rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  {{ editingIndex !== null ? '编辑地址' : '添加新地址' }}
                </h3>

                <div class="space-y-4">
                  <!-- Name -->
                  <div class="grid gap-1.5">
                    <label for="addr-name" class="text-sm font-medium text-gray-700">收货人</label>
                    <input
                      id="addr-name"
                      v-model="form.name"
                      type="text"
                      class="input input-bordered w-full bg-white"
                      placeholder="请输入收货人名字"
                    />
                  </div>

                  <!-- Phone -->
                  <div class="grid gap-1.5">
                    <label for="addr-phone" class="text-sm font-medium text-gray-700">电话号码</label>
                    <input
                      id="addr-phone"
                      v-model="form.phone"
                      type="tel"
                      class="input input-bordered w-full bg-white"
                      placeholder="请输入电话号码"
                    />
                  </div>

                  <!-- Province -->
                  <div class="grid gap-1.5">
                    <label for="addr-province" class="text-sm font-medium text-gray-700">省份</label>
                    <input
                      id="addr-province"
                      v-model="form.province"
                      type="text"
                      class="input input-bordered w-full bg-white"
                      placeholder="如：浙江省"
                    />
                  </div>

                  <!-- City -->
                  <div class="grid gap-1.5">
                    <label for="addr-city" class="text-sm font-medium text-gray-700">城市</label>
                    <input
                      id="addr-city"
                      v-model="form.city"
                      type="text"
                      class="input input-bordered w-full bg-white"
                      placeholder="如：杭州市"
                    />
                  </div>

                  <!-- District -->
                  <div class="grid gap-1.5">
                    <label for="addr-district" class="text-sm font-medium text-gray-700">区县</label>
                    <input
                      id="addr-district"
                      v-model="form.district"
                      type="text"
                      class="input input-bordered w-full bg-white"
                      placeholder="如：西湖区"
                    />
                  </div>

                  <!-- Address -->
                  <div class="grid gap-1.5">
                    <label for="addr-detail" class="text-sm font-medium text-gray-700">详细地址</label>
                    <textarea
                      id="addr-detail"
                      v-model="form.address"
                      rows="2"
                      class="textarea textarea-bordered w-full bg-white resize-none"
                      placeholder="请输入街道地址、门牌号等详细信息"
                    />
                  </div>

                  <!-- Default Address -->
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="form.isDefault"
                      type="checkbox"
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                    <span class="text-sm text-gray-700">设为默认地址</span>
                  </label>
                </div>
              </div>

              <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl flex justify-end gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="closeForm"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="saveAddress"
                >
                  保存地址
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { Save, Plus, MapPin } from 'lucide-vue-next'

defineProps({
  user: { type: Object, default: null }
})

const emit = defineEmits(['save'])

const showAddForm = ref(false)
const editingIndex = ref(null)

const addresses = ref([
  {
    name: '张三',
    phone: '15812345678',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    address: '文一西路1号',
    isDefault: true
  }
])

const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isDefault: false
})

const resetForm = () => {
  form.name = ''
  form.phone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.address = ''
  form.isDefault = false
}

const closeForm = () => {
  showAddForm.value = false
  editingIndex.value = null
  resetForm()
}

const editAddress = (index) => {
  editingIndex.value = index
  const addr = addresses.value[index]
  form.name = addr.name
  form.phone = addr.phone
  form.province = addr.province
  form.city = addr.city
  form.district = addr.district
  form.address = addr.address
  form.isDefault = addr.isDefault
  showAddForm.value = true
}

const saveAddress = () => {
  if (!form.name || !form.phone || !form.province || !form.city || !form.address) {
    emit('save', { type: 'error', message: '请填写完整的地址信息' })
    return
  }

  if (editingIndex.value !== null) {
    // Edit existing
    addresses.value[editingIndex.value] = { ...form }
    emit('save', '地址已更新')
  } else {
    // Add new
    addresses.value.push({ ...form })
    emit('save', '地址已添加')
  }

  closeForm()
}

const deleteAddress = (index) => {
  addresses.value.splice(index, 1)
  emit('save', '地址已删除')
}
</script>
