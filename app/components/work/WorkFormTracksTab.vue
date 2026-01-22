<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Discs & Tracks</h2>
      <button type="button" class="btn btn-sm btn-primary" @click="addDisc">
        <Plus :size="16" />
        Add Disc
      </button>
    </div>

    <div v-if="formData.structure.length === 0" class="text-center py-8 text-gray-500">
      No discs added yet. Click "Add Disc" to start.
    </div>

    <!-- Disc List -->
    <div v-for="(disc, discIndex) in formData.structure" :key="disc.id" class="border border-gray-200 rounded-lg p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-lg">Disc {{ discIndex + 1 }}</h3>
        <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeDisc(discIndex)">
          <Trash2 :size="16" />
          Remove Disc
        </button>
      </div>

      <!-- Disc Title -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Disc Title (Optional)</span>
        </label>
        <input
          v-model="disc.title"
          type="text"
          placeholder="e.g., Main Album, Bonus Disc"
          class="input input-bordered input-sm w-full"
        />
      </div>

      <!-- Disc Options -->
      <div class="flex flex-wrap gap-4">
        <label class="label cursor-pointer gap-2">
          <input
            v-model="disc.is_bonus"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">Bonus Disc</span>
        </label>
        <label class="label cursor-pointer gap-2">
          <input
            v-model="disc.is_counted"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">Count in Total</span>
        </label>
      </div>

      <!-- Tracks -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-medium">Tracks</span>
          <button type="button" class="btn btn-xs btn-outline" @click="addTrack(discIndex)">
            <Plus :size="14" />
            Add Track
          </button>
        </div>

        <div v-if="disc.songs.length === 0" class="text-sm text-gray-500 py-4 text-center">
          No tracks yet. Click "Add Track" to add.
        </div>

        <div v-for="(song, songIndex) in disc.songs" :key="song.id" class="bg-gray-50 rounded p-3 space-y-2">
          <div class="flex items-start gap-2">
            <span class="text-sm font-medium text-gray-600 mt-2">{{ songIndex + 1 }}.</span>
            <div class="flex-1 space-y-2">
              <input
                v-model="song.title"
                type="text"
                placeholder="Track title"
                class="input input-bordered input-sm w-full"
              />
              <input
                v-model="song.duration"
                type="text"
                placeholder="Duration (e.g., 3:45)"
                class="input input-bordered input-sm w-full"
              />
            </div>
            <button type="button" class="btn btn-xs btn-ghost text-error" @click="removeTrack(discIndex, songIndex)">
              <X :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next'

interface Song {
  id: string
  track_number: number
  title: string
  duration: string
}

interface Disc {
  id: string
  disc_number: number
  title: string
  is_bonus: boolean
  is_counted: boolean
  songs: Song[]
}

interface FormData {
  structure: Disc[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

let discIdCounter = 0
let trackIdCounter = 0

const addDisc = () => {
  const newStructure: Disc[] = [
    ...props.formData.structure,
    {
      id: `disc-${discIdCounter++}`,
      disc_number: props.formData.structure.length + 1,
      title: '',
      is_bonus: false,
      is_counted: true,
      songs: [],
    },
  ]
  emit('update:formData', { ...props.formData, structure: newStructure })
}

const removeDisc = (index: number) => {
  const newStructure = props.formData.structure.filter((_, i) => i !== index)
  // 重新编号
  newStructure.forEach((disc, i) => {
    disc.disc_number = i + 1
  })
  emit('update:formData', { ...props.formData, structure: newStructure })
}

const addTrack = (discIndex: number) => {
  const newStructure = [...props.formData.structure]
  const disc = { ...newStructure[discIndex] }
  disc.songs = [
    ...disc.songs,
    {
      id: `track-${trackIdCounter++}`,
      track_number: disc.songs.length + 1,
      title: '',
      duration: '',
    },
  ]
  newStructure[discIndex] = disc
  emit('update:formData', { ...props.formData, structure: newStructure })
}

const removeTrack = (discIndex: number, trackIndex: number) => {
  const newStructure = [...props.formData.structure]
  const disc = { ...newStructure[discIndex] }
  disc.songs = disc.songs.filter((_, i) => i !== trackIndex)
  // 重新编号
  disc.songs.forEach((song, i) => {
    song.track_number = i + 1
  })
  newStructure[discIndex] = disc
  emit('update:formData', { ...props.formData, structure: newStructure })
}
</script>
