<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">External Links</h2>
      <button type="button" class="btn btn-sm btn-primary" @click="addLink">
        <Plus :size="16" />
        Add Link
      </button>
    </div>

    <div v-if="formData.links.length === 0" class="text-center py-8 text-gray-500">
      No links added yet. Click "Add Link" to start.
    </div>

    <div v-for="(link, index) in formData.links" :key="link.id" class="border border-gray-200 rounded-lg p-4">
      <div class="flex items-start gap-4">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Platform</span>
            </label>
            <select v-model="link.platform" class="select select-bordered select-sm w-full">
              <option value="spotify">Spotify</option>
              <option value="apple_music">Apple Music</option>
              <option value="youtube">YouTube</option>
              <option value="bandcamp">Bandcamp</option>
              <option value="soundcloud">SoundCloud</option>
              <option value="official_site">Official Site</option>
              <option value="twitter">Twitter</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">URL</span>
            </label>
            <input
              v-model="link.url"
              type="url"
              placeholder="https://..."
              class="input input-bordered input-sm w-full"
            />
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeLink(index)">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'

interface Link {
  id: string
  platform: string
  url: string
}

interface FormData {
  links: Link[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

let linkIdCounter = 0

const addLink = () => {
  const newLinks = [
    ...props.formData.links,
    {
      id: `link-${linkIdCounter++}`,
      platform: 'official_site',
      url: '',
    },
  ]
  emit('update:formData', { ...props.formData, links: newLinks })
}

const removeLink = (index: number) => {
  const newLinks = props.formData.links.filter((_, i) => i !== index)
  emit('update:formData', { ...props.formData, links: newLinks })
}
</script>
