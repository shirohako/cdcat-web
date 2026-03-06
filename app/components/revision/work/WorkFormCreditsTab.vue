<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Credits</h2>
        <button type="button" class="btn btn-sm btn-primary gap-1" @click="addCredit">
          <Plus :size="14" />
          Add Credit
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        这里可以添加专辑的创作信息（如作词、作曲、编曲等），也可以为具体曲目单独添加创作信息。
      </p>
    </div>

    <div v-if="formData.credits.length === 0" class="text-center py-8 text-gray-500">
      No credits added yet. Click "Add Credit" to start.
    </div>

    <div v-for="(credit, index) in formData.credits" :key="credit.id" class="border border-gray-200 rounded-lg p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Artist ID</span>
            </label>
            <input
              v-model="credit.artist_id"
              type="text"
              placeholder="Artist ID"
              class="input input-bordered input-sm w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Display Name <span class="font-normal text-gray-400">(Optional)</span></span>
            </label>
            <input
              v-model="credit.display_name"
              type="text"
              placeholder="Display name"
              class="input input-bordered input-sm w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Role</span>
            </label>
            <input
              v-model="credit.role"
              type="text"
              placeholder="e.g. Vocal, Guitar, Mix"
              class="input input-bordered input-sm w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Track (Optional)</span>
            </label>
            <input
              v-model="credit.track"
              type="text"
              placeholder="e.g. 1.2 (Disc 1 Track 2)"
              class="input input-bordered input-sm w-full"
            />
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeCredit(index)">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'

interface Credit {
  id: string
  artist_id: string
  display_name: string
  role: string
  track: string
}

interface FormData {
  credits: Credit[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

let creditIdCounter = 0

const addCredit = () => {
  const newCredits = [
    ...props.formData.credits,
    {
      id: `credit-${creditIdCounter++}`,
      artist_id: '',
      display_name: '',
      role: '',
      track: '',
    },
  ]
  emit('update:formData', { ...props.formData, credits: newCredits })
}

const removeCredit = (index: number) => {
  const newCredits = props.formData.credits.filter((_, i) => i !== index)
  emit('update:formData', { ...props.formData, credits: newCredits })
}
</script>
