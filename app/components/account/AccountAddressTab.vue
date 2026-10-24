<template>
  <div class="space-y-6">
    <section class="card overflow-hidden">
      <div class="p-6 pb-5 border-b border-line flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-title">{{ t('account_pages.address.title') }}</h2>
          <p class="text-sm text-meta mt-1">{{ t('account_pages.address.description') }}</p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          @click="showAddForm = true"
        >
          <Plus :size="14" />
          {{ t('account_pages.address.add') }}
        </button>
      </div>

      <!-- Address List -->
      <div v-if="addresses.length > 0" class="divide-y divide-line">
        <div
          v-for="(address, index) in addresses"
          :key="index"
          class="p-6 flex items-start justify-between gap-4 hover:bg-card-hover transition-colors duration-150 ease-out"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-medium text-title">{{ address.name }}</h3>
              <span v-if="address.isDefault" class="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                {{ t('account_pages.address.default') }}
              </span>
            </div>
            <p class="text-sm text-body mb-1">
              {{ address.province }}{{ address.city }}{{ address.district }}{{ address.address }}
            </p>
            <p class="text-sm text-meta">
              {{ address.name }} · {{ address.phone }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="link text-sm"
              @click="editAddress(index)"
            >
              {{ t('common.edit') }}
            </button>
            <button
              type="button"
              class="text-sm text-danger transition-colors duration-150 ease-out hover:text-danger/80"
              @click="deleteAddress(index)"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <UiEmpty v-else :title="t('account_pages.address.empty')" :icon="MapPin">
        <template #actions>
          <button
            type="button"
            class="link text-sm"
            @click="showAddForm = true"
          >
            {{ t('account_pages.address.add_now') }}
          </button>
        </template>
      </UiEmpty>
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
            <div v-if="showAddForm" class="bg-card rounded-2xl shadow-overlay w-full max-w-md ring-1 ring-line max-h-[90vh] overflow-y-auto">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-title mb-4">
                  {{ editingIndex !== null ? t('account_pages.address.edit_title') : t('account_pages.address.add_title') }}
                </h3>

                <div class="space-y-4">
                  <!-- Name -->
                  <div class="grid gap-1.5">
                    <label for="addr-name" class="text-sm font-medium text-body">{{ t('account_pages.address.recipient') }}</label>
                    <input
                      id="addr-name"
                      v-model="form.name"
                      type="text"
                      class="input w-full"
                      :placeholder="t('account_pages.address.recipient_placeholder')"
                    />
                  </div>

                  <!-- Phone -->
                  <div class="grid gap-1.5">
                    <label for="addr-phone" class="text-sm font-medium text-body">{{ t('account_pages.address.phone') }}</label>
                    <input
                      id="addr-phone"
                      v-model="form.phone"
                      type="tel"
                      class="input w-full"
                      :placeholder="t('account_pages.address.phone_placeholder')"
                    />
                  </div>

                  <!-- Province -->
                  <div class="grid gap-1.5">
                    <label for="addr-province" class="text-sm font-medium text-body">{{ t('account_pages.address.province') }}</label>
                    <input
                      id="addr-province"
                      v-model="form.province"
                      type="text"
                      class="input w-full"
                      :placeholder="t('account_pages.address.province_placeholder')"
                    />
                  </div>

                  <!-- City -->
                  <div class="grid gap-1.5">
                    <label for="addr-city" class="text-sm font-medium text-body">{{ t('account_pages.address.city') }}</label>
                    <input
                      id="addr-city"
                      v-model="form.city"
                      type="text"
                      class="input w-full"
                      :placeholder="t('account_pages.address.city_placeholder')"
                    />
                  </div>

                  <!-- District -->
                  <div class="grid gap-1.5">
                    <label for="addr-district" class="text-sm font-medium text-body">{{ t('account_pages.address.district') }}</label>
                    <input
                      id="addr-district"
                      v-model="form.district"
                      type="text"
                      class="input w-full"
                      :placeholder="t('account_pages.address.district_placeholder')"
                    />
                  </div>

                  <!-- Address -->
                  <div class="grid gap-1.5">
                    <label for="addr-detail" class="text-sm font-medium text-body">{{ t('account_pages.address.details') }}</label>
                    <textarea
                      id="addr-detail"
                      v-model="form.address"
                      rows="2"
                      class="textarea w-full resize-none"
                      :placeholder="t('account_pages.address.details_placeholder')"
                    />
                  </div>

                  <!-- Default Address -->
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="form.isDefault"
                      type="checkbox"
                      class="checkbox checkbox-sm"
                    />
                    <span class="text-sm text-body">{{ t('account_pages.address.set_default') }}</span>
                  </label>
                </div>
              </div>

              <div class="px-6 py-4 bg-sunken border-t border-line rounded-b-2xl flex justify-end gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="closeForm"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="saveAddress"
                >
                  {{ t('account_pages.address.save') }}
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
import { Save, Plus, MapPin } from '@lucide/vue'

defineProps({
  user: { type: Object, default: null }
})

const emit = defineEmits(['save'])
const { t } = useI18n()

const showAddForm = ref(false)
const editingIndex = ref(null)

const addresses = ref([
  {
    name: '',
    phone: '15812345678',
    province: '',
    city: '',
    district: '',
    address: '',
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
    emit('save', { type: 'error', message: t('account_pages.address.incomplete') })
    return
  }

  if (editingIndex.value !== null) {
    // Edit existing
    addresses.value[editingIndex.value] = { ...form }
    emit('save', t('account_pages.address.updated'))
  } else {
    // Add new
    addresses.value.push({ ...form })
    emit('save', t('account_pages.address.added'))
  }

  closeForm()
}

const deleteAddress = (index) => {
  addresses.value.splice(index, 1)
  emit('save', t('account_pages.address.deleted'))
}
</script>
