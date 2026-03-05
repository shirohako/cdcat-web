<template>
  <div class="space-y-6">
    <!-- 标题 + 说明 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Associated Artists</h2>
        <button type="button" class="btn btn-sm btn-primary gap-1" @click="addArtist">
          <Plus :size="14" />
          Add Artist
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        关联作品的主要创作者和歌手。填写对应的歌手 ID（应为数字）。<br />
        若歌手或音乐人尚未收录于数据库，可前往
        <NuxtLink to="/artists/create" class="text-primary hover:underline">艺术家页面</NuxtLink>
        创建后再回来关联。
      </p>
    </div>

    <!-- 空状态 -->
    <div v-if="formData.artists.length === 0" class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 gap-2">
      <Users :size="32" class="opacity-40" />
      <p class="text-sm">暂无关联艺术家</p>
    </div>

    <!-- 艺术家列表 -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="(artist, index) in formData.artists"
        :key="artist.id"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 group"
      >
        <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">
          {{ index + 1 }}
        </div>
        <input
          v-model="artist.artist_id"
          type="text"
          placeholder="Artist ID（数字）"
          class="input input-bordered input-sm flex-1 bg-white"
        />
        <button
          type="button"
          class="btn btn-sm btn-ghost text-gray-400 hover:text-error hover:bg-error/10"
          @click="removeArtist(index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, Users } from 'lucide-vue-next'

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
