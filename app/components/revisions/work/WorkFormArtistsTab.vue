<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Associated Artists</h2>
      <button type="button" class="btn btn-sm btn-primary" @click="addArtist">
        <Plus :size="16" />
        Add Artist
      </button>
    </div>

    <div v-if="formData.artists.length === 0" class="text-center py-8 text-gray-500">
      No artists associated yet. Click "Add Artist" to start.
    </div>

    <div v-for="(artist, index) in formData.artists" :key="artist.id" class="border border-gray-200 rounded-lg p-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Artist ID</span>
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model="artist.artist_id"
            type="text"
            placeholder="Enter artist ID"
            class="input input-bordered input-sm flex-1"
          />
          <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeArtist(index)">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'

interface Artist {
  id: string
  artist_id: string
}

interface FormData {
  artists: Artist[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

let artistIdCounter = 0

const addArtist = () => {
  const newArtists = [
    ...props.formData.artists,
    {
      id: `artist-${artistIdCounter++}`,
      artist_id: '',
    },
  ]
  emit('update:formData', { ...props.formData, artists: newArtists })
}

const removeArtist = (index: number) => {
  const newArtists = props.formData.artists.filter((_, i) => i !== index)
  emit('update:formData', { ...props.formData, artists: newArtists })
}
</script>
