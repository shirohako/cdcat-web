<template>
  <div class="space-y-6">
    <!-- 标题 + 说明 -->
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Associated Artists</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        关联作品的主要创作者和歌手。输入艺术家 ID 后点击查询添加。<br />
        若歌手或音乐人尚未收录于数据库，可前往
        <NuxtLink to="/artists/create" class="text-primary hover:underline">艺术家页面</NuxtLink>
        创建后再回来关联。
      </p>
    </div>

    <!-- 关联艺术家 -->
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
      <!-- 网格：已有艺术家 + 添加 tile -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <!-- 艺术家卡片 -->
        <div
          v-for="(artist, index) in formData.artists"
          :key="artist.id"
          class="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 group"
        >
          <!-- 左上：artist_id -->
          <span class="absolute top-1.5 left-1.5 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 leading-none">
            {{ artist.artist_id }}
          </span>

          <!-- 右上：删除按钮 -->
          <button
            type="button"
            class="absolute top-1.5 right-1.5 btn btn-xs btn-ghost text-gray-300 hover:text-error hover:bg-error/10"
            @click="removeArtist(index)"
          >
            <X :size="13" />
          </button>

          <!-- 右下：状态标记 -->
          <span
            v-if="artist.pivot_id"
            class="absolute bottom-1.5 right-1.5 text-[10px] font-medium text-blue-500 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 leading-none pointer-events-none"
          >已关联</span>
          <span
            v-else
            class="absolute bottom-1.5 right-1.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1 py-0.5 leading-none pointer-events-none"
          >NEW</span>

          <!-- 头像 -->
          <div class="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0">
            <img
              v-if="artistInfoMap[artist.artist_id]?.image_url"
              :src="artistInfoMap[artist.artist_id]!.image_url"
              :alt="artistInfoMap[artist.artist_id]?.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
              {{ artist.artist_id }}
            </div>
          </div>

          <!-- 名称 -->
          <div class="text-center min-w-0 w-full">
            <p v-if="artistInfoMap[artist.artist_id]?.name" class="text-xs font-medium text-gray-800 truncate">
              {{ artistInfoMap[artist.artist_id]!.name }}
            </p>
            <p v-else class="text-xs text-gray-400 italic truncate">未知</p>
          </div>
        </div>

        <!-- 添加 tile -->
        <button
          type="button"
          class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary hover:text-primary transition-colors min-h-25"
          @click="focusAddInput"
        >
          <Plus :size="20" />
          <span class="text-xs">添加艺术家</span>
        </button>
      </div>

      <!-- 搜索输入（点击添加 tile 后显示） -->
      <div v-if="showAddInput">
        <div class="flex gap-2">
          <input
            ref="addInputRef"
            v-model="inputId"
            type="text"
            placeholder="输入艺术家 ID（数字）"
            class="input input-bordered input-sm flex-1 bg-white"
            @keydown.enter.prevent="lookupArtist"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary gap-1"
            :disabled="!inputId.trim() || lookupLoading"
            @click="lookupArtist"
          >
            <span v-if="lookupLoading" class="loading loading-spinner loading-xs" />
            <Search v-else :size="14" />
            查询
          </button>
          <button type="button" class="btn btn-sm btn-ghost text-gray-400" @click="closeAddInput">
            <X :size="14" />
          </button>
        </div>

        <!-- 查询错误 -->
        <p v-if="lookupError" class="mt-2 text-xs text-error">{{ lookupError }}</p>

        <!-- 查询结果预览 -->
        <div v-if="previewArtist" class="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-primary/30">
          <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-100">
            <img
              v-if="previewArtist.image_url"
              :src="previewArtist.image_url"
              :alt="previewArtist.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Users :size="16" class="text-gray-300" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">{{ previewArtist.name }}</p>
            <p class="text-xs text-gray-400">ID: {{ previewArtist.id }}</p>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button type="button" class="btn btn-sm btn-primary gap-1" @click="confirmAdd">
              <Plus :size="13" />
              添加
            </button>
            <button type="button" class="btn btn-sm btn-ghost text-gray-400" @click="clearPreview">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Plus, X, Users, Search } from 'lucide-vue-next'

interface ArtistInfo {
  id: number | string
  name: string
  image_url?: string
}

interface Artist {
  id: string
  artist_id: string
  display_name?: string
  pivot_id?: number | null
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

const { $api } = useNuxtApp()

// Map of artist_id -> resolved info
const artistInfoMap = reactive<Record<string, ArtistInfo>>({})

const showAddInput = ref(false)
const addInputRef = ref<HTMLInputElement | null>(null)

const focusAddInput = () => {
  showAddInput.value = true
  nextTick(() => addInputRef.value?.focus())
}

const closeAddInput = () => {
  showAddInput.value = false
  clearPreview()
}

const inputId = ref('')
const lookupLoading = ref(false)
const lookupError = ref('')
const previewArtist = ref<ArtistInfo | null>(null)

let artistIdCounter = 0

// Track artist IDs that existed on mount (not "new")
const existingArtistIds = new Set<string>()

// On mount: batch-lookup existing artist IDs
onMounted(async () => {
  const ids = props.formData.artists.map(a => a.artist_id).filter(Boolean)
  ids.forEach(id => existingArtistIds.add(id))
  if (ids.length === 0) return
  await batchLookup(ids)
})

// Watch for external artist list changes (e.g. JSON apply)
watch(
  () => props.formData.artists,
  async (artists) => {
    const missing = artists.map(a => a.artist_id).filter(id => id && !artistInfoMap[id])
    if (missing.length > 0) {
      await batchLookup(missing)
    }
  },
  { deep: true }
)

const batchLookup = async (ids: string[]) => {
  try {
    const result = await $api(`/v1/artists/lookup?ids=${ids.join(',')}`)
    const list: ArtistInfo[] = (result as { artists: ArtistInfo[] }).artists ?? []
    for (const artist of list) {
      artistInfoMap[String(artist.id)] = artist
    }
  } catch {
    // silently ignore — will show raw ID as fallback
  }
}

const lookupArtist = async () => {
  const id = inputId.value.trim()
  if (!id) return

  // Already added?
  if (props.formData.artists.some(a => a.artist_id === id)) {
    lookupError.value = '该艺术家已添加'
    return
  }

  // Already in cache
  if (artistInfoMap[id]) {
    previewArtist.value = artistInfoMap[id]
    lookupError.value = ''
    return
  }

  lookupLoading.value = true
  lookupError.value = ''
  previewArtist.value = null

  try {
    const result = await $api(`/v1/artists/lookup?ids=${id}`)
    const list: ArtistInfo[] = (result as { artists: ArtistInfo[] }).artists ?? []
    const found = list.find(a => String(a.id) === id)
    if (!found) {
      lookupError.value = `未找到 ID 为 ${id} 的艺术家`
      return
    }
    artistInfoMap[id] = found
    previewArtist.value = found
  } catch {
    lookupError.value = '查询失败，请检查 ID 是否正确'
  } finally {
    lookupLoading.value = false
  }
}

const confirmAdd = () => {
  if (!previewArtist.value) return
  const id = String(previewArtist.value.id)
  const newArtists = [
    ...props.formData.artists,
    { id: `artist-${artistIdCounter++}`, artist_id: id },
  ]
  emit('update:formData', { ...props.formData, artists: newArtists })
  closeAddInput()
}

const clearPreview = () => {
  previewArtist.value = null
  inputId.value = ''
  lookupError.value = ''
}

const removeArtist = (index: number) => {
  const newArtists = props.formData.artists.filter((_, i) => i !== index)
  emit('update:formData', { ...props.formData, artists: newArtists })
}
</script>
