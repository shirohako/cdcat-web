<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Credits</h2>
      <button type="button" class="btn btn-sm btn-primary" @click="addCredit">
        <Plus :size="16" />
        Add Credit
      </button>
    </div>

    <div v-if="formData.credits.length === 0" class="text-center py-8 text-gray-500">
      No credits added yet. Click "Add Credit" to start.
    </div>

    <div v-for="(credit, index) in formData.credits" :key="credit.id" class="border border-gray-200 rounded-lg p-4">
      <div class="flex items-start gap-4">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Name</span>
            </label>
            <input
              v-model="credit.name"
              type="text"
              placeholder="Person or artist name"
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
              placeholder="e.g., Vocal, Guitar, Mix"
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
              placeholder="Specific track or leave blank for all"
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
  name: string
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
      name: '',
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
