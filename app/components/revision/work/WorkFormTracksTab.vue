<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Discs & Tracks</h2>
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1"
          :disabled="showAddDiscForm"
          @click="openAddDiscForm"
        >
          <Plus :size="14" />
          Add Disc
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        这里可以添加收录的具体曲目信息，包括碟片结构与每张碟片内的曲目列表。
      </p>
    </div>

    <!-- Inline Add Disc Form -->
    <div v-if="showAddDiscForm" class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div class="flex items-center gap-2 mb-1">
        <Disc3 :size="16" class="text-primary" />
        <span class="text-sm font-semibold text-gray-800">新碟片信息</span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-gray-600">曲目数量 <span class="text-red-500">*</span></span>
          <input
            ref="trackCountInputRef"
            v-model.number="newDiscForm.trackCount"
            type="number"
            min="1"
            max="99"
            class="input input-bordered input-sm w-full bg-white"
            placeholder="e.g., 12"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-gray-600">碟片标题（可选）</span>
          <input
            v-model="newDiscForm.title"
            type="text"
            placeholder="e.g., Main Album, Bonus Disc"
            class="input input-bordered input-sm w-full bg-white"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-gray-600">Catalog Number（可选）</span>
        <input
          v-model="newDiscForm.catalog_number"
          type="text"
          placeholder="e.g., ABCD-1234"
          class="input input-bordered input-sm w-full bg-white"
        />
      </div>

      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="newDiscForm.is_bonus" type="checkbox" class="checkbox checkbox-sm" />
          <span class="text-sm text-gray-700">Bonus Disc</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="newDiscForm.is_counted" type="checkbox" class="checkbox checkbox-sm" />
          <span class="text-sm text-gray-700">Count in Total</span>
        </label>
      </div>

      <div class="flex gap-2 justify-end border-t border-primary/20 pt-3">
        <button type="button" class="btn btn-sm btn-ghost text-gray-500" @click="closeAddDiscForm">
          取消
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1"
          :disabled="!newDiscForm.trackCount || newDiscForm.trackCount < 1"
          @click="confirmAddDisc"
        >
          <Plus :size="13" />
          添加 {{ newDiscForm.trackCount }} 首曲目
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="formData.structure.length === 0 && !showAddDiscForm" class="text-center py-12 text-gray-400">
      <Disc3 :size="32" class="mx-auto mb-3 opacity-30" />
      <p class="text-sm">暂无碟片，点击「Add Disc」开始添加。</p>
    </div>

    <!-- Disc List -->
    <div
      v-for="(disc, discIndex) in formData.structure"
      :key="disc.id"
      class="rounded-xl border border-gray-200 bg-white overflow-hidden"
    >
      <!-- Disc Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center gap-2 min-w-0">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-600 shrink-0">
            {{ disc.disc_number }}
          </span>
          <span v-if="disc.title" class="text-sm font-semibold text-gray-800 truncate">{{ disc.title }}</span>
          <span v-else class="text-sm text-gray-400 italic">Disc {{ disc.disc_number }}</span>
          <span v-if="disc.is_bonus" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 shrink-0">BONUS</span>
          <span v-if="disc.catalog_number" class="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">{{ disc.catalog_number }}</span>
        </div>
        <button
          type="button"
          class="btn btn-xs btn-ghost text-gray-400 hover:text-error hover:bg-error/10 shrink-0"
          @click="askConfirm('删除碟片', `确认删除「Disc ${disc.disc_number}」及其所有 ${disc.songs.length} 首曲目吗？此操作不可撤销。`, () => removeDisc(discIndex))"
        >
          <Trash2 :size="14" />
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Disc Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500">碟片标题</span>
            <input
              v-model="disc.title"
              type="text"
              placeholder="可选"
              class="input input-bordered input-sm w-full bg-gray-50"
            />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500">Catalog Number</span>
            <input
              v-model="disc.catalog_number"
              type="text"
              placeholder="可选，e.g. ABCD-1234"
              class="input input-bordered input-sm w-full bg-gray-50"
            />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500">碟片总时长</span>
            <input
              v-model="disc.length"
              type="text"
              placeholder="可选，e.g. 45:30"
              class="input input-bordered input-sm w-full bg-gray-50"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center justify-between gap-3 cursor-pointer px-3 py-2.5 rounded-lg border transition-colors"
            :class="disc.is_bonus ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'"
          >
            <div>
              <span class="text-sm font-medium text-gray-700 block">Bonus Disc</span>
              <span class="text-xs text-gray-400">如果是特典 CD 请勾选</span>
            </div>
            <input v-model="disc.is_bonus" type="checkbox" class="checkbox checkbox-sm shrink-0" />
          </label>
          <label
            class="flex items-center justify-between gap-3 cursor-pointer px-3 py-2.5 rounded-lg border transition-colors"
            :class="disc.is_counted ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'"
          >
            <div>
              <span class="text-sm font-medium text-gray-700 block">Count in Total</span>
              <span class="text-xs text-gray-400">勾选后记录入专辑总数量</span>
            </div>
            <input v-model="disc.is_counted" type="checkbox" class="checkbox checkbox-sm shrink-0" />
          </label>
        </div>

        <!-- Track List -->
        <div class="space-y-1">
          <!-- Set Track Count -->
          <div class="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-gray-100">
            <span class="text-xs text-gray-400">共 {{ disc.songs.length }} 首曲目</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-gray-400">设定总数</span>
              <input
                type="number"
                min="0"
                max="99"
                :value="pendingTrackCounts[disc.id] ?? disc.songs.length"
                class="input input-bordered input-xs w-14 text-center tabular-nums"
                @input="pendingTrackCounts[disc.id] = parseInt(($event.target as HTMLInputElement).value) || 0"
              />
              <button
                type="button"
                class="btn btn-xs btn-primary"
                @click="applyTrackCount(discIndex, disc.id)"
              >
                确认
              </button>
            </div>
          </div>

          <!-- Table Header -->
          <div class="hidden sm:grid grid-cols-[2rem_1fr_5rem_4.5rem_2rem] gap-2 px-1 pb-1 border-b border-gray-100">
            <span class="text-[10px] font-semibold text-gray-400 text-center">#</span>
            <span class="text-[10px] font-semibold text-gray-400">曲目标题</span>
            <span class="text-[10px] font-semibold text-gray-400 text-center">时长</span>
            <span class="text-[10px] font-semibold text-gray-400 text-center">纯音乐</span>
            <span />
          </div>

          <!-- Track Rows -->
          <div
            v-for="(song, songIndex) in disc.songs"
            :key="song.id ?? `new-${songIndex}`"
            class="grid grid-cols-[2rem_1fr_5rem_4.5rem_2rem] gap-2 items-center py-0.5"
          >
            <span class="text-xs font-medium text-gray-400 text-center tabular-nums">{{ song.track_number }}</span>
            <input
              v-model="song.title"
              type="text"
              placeholder="曲目标题"
              class="input input-bordered input-xs w-full bg-gray-50"
            />
            <input
              type="text"
              :value="secondsToMmss(song.duration)"
              placeholder="3:45"
              class="input input-bordered input-xs w-full bg-gray-50 text-center tabular-nums"
              @change="updateDuration(discIndex, songIndex, ($event.target as HTMLInputElement).value)"
            />
            <div class="flex items-center justify-center">
              <input v-model="song.is_instrumental" type="checkbox" class="checkbox checkbox-xs" />
            </div>
            <button
              v-if="!song.id"
              type="button"
              class="flex items-center justify-center btn btn-xs btn-ghost text-gray-300 hover:text-error hover:bg-error/10 p-0 min-h-0 h-6 w-6"
              @click="askConfirm('删除曲目', `确认删除 Disc ${disc.disc_number} 第 ${song.track_number} 首「${song.title || '未命名'}」吗？`, () => removeTrack(discIndex, songIndex))"
            >
              <X :size="12" />
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <CommonConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      @confirm="confirmDialog.onConfirm()"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, X, Disc3 } from 'lucide-vue-next'

interface Song {
  id?: string | number
  track_number: number
  title: string
  duration: number
  is_instrumental: boolean
}

interface Disc {
  id: string
  disc_number: number
  title: string | null
  catalog_number: string | null
  length: string | null
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

// ─── Duration helpers ────────────────────────────────────────────────────────

function secondsToMmss(sec: number | null | undefined): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function mmssToSeconds(str: string): number {
  const parts = str.trim().split(':')
  if (parts.length !== 2) return 0
  const m = parseInt(parts[0] ?? '0') || 0
  const s = parseInt(parts[1] ?? '0') || 0
  return m * 60 + s
}

function updateDuration(discIndex: number, songIndex: number, value: string) {
  const newStructure = props.formData.structure.map((d, di) => {
    if (di !== discIndex) return d
    return {
      ...d,
      songs: d.songs.map((s, si) =>
        si === songIndex ? { ...s, duration: mmssToSeconds(value) } : s
      ),
    }
  })
  emit('update:formData', { ...props.formData, structure: newStructure })
}

// ─── Add Disc form ───────────────────────────────────────────────────────────

const showAddDiscForm = ref(false)
const trackCountInputRef = ref<HTMLInputElement | null>(null)

const newDiscForm = reactive({
  trackCount: 12,
  title: '',
  catalog_number: '',
  is_bonus: false,
  is_counted: true,
})

let discIdCounter = 0

function openAddDiscForm() {
  showAddDiscForm.value = true
  nextTick(() => trackCountInputRef.value?.focus())
}

function closeAddDiscForm() {
  showAddDiscForm.value = false
  Object.assign(newDiscForm, { trackCount: 12, title: '', catalog_number: '', is_bonus: false, is_counted: true })
}

function confirmAddDisc() {
  const count = Math.max(1, Math.min(99, newDiscForm.trackCount || 1))
  const songs: Song[] = Array.from({ length: count }, (_, i) => ({
    track_number: i + 1,
    title: '',
    duration: 0,
    is_instrumental: false,
  }))

  const newDisc: Disc = {
    id: `disc-${discIdCounter++}`,
    disc_number: props.formData.structure.length + 1,
    title: newDiscForm.title || null,
    catalog_number: newDiscForm.catalog_number || null,
    length: null,
    is_bonus: newDiscForm.is_bonus,
    is_counted: newDiscForm.is_counted,
    songs,
  }

  emit('update:formData', {
    ...props.formData,
    structure: [...props.formData.structure, newDisc],
  })
  closeAddDiscForm()
}

// ─── Disc / Track operations ─────────────────────────────────────────────────

const removeDisc = (index: number) => {
  const newStructure = props.formData.structure
    .filter((_, i) => i !== index)
    .map((disc, i) => ({ ...disc, disc_number: i + 1 }))
  emit('update:formData', { ...props.formData, structure: newStructure })
}

// ─── Set track count ─────────────────────────────────────────────────────────

const pendingTrackCounts = reactive<Record<string, number>>({})

watch(
  () => props.formData.structure,
  (discs) => {
    for (const disc of discs) {
      if (!(disc.id in pendingTrackCounts)) {
        pendingTrackCounts[disc.id] = disc.songs.length
      }
    }
  },
  { immediate: true },
)

function doSetTrackCount(discIndex: number, discId: string, newCount: number) {
  const newStructure = props.formData.structure.map((d, di) => {
    if (di !== discIndex) return d
    if (newCount > d.songs.length) {
      const additions: Song[] = Array.from({ length: newCount - d.songs.length }, (_, i) => ({
        track_number: d.songs.length + i + 1,
        title: '',
        duration: 0,
        is_instrumental: false,
      }))
      return { ...d, songs: [...d.songs, ...additions] }
    }
    return { ...d, songs: d.songs.slice(0, newCount).map((s, i) => ({ ...s, track_number: i + 1 })) }
  })
  pendingTrackCounts[discId] = newCount
  emit('update:formData', { ...props.formData, structure: newStructure })
}

function applyTrackCount(discIndex: number, discId: string) {
  const disc = props.formData.structure[discIndex]
  if (!disc) return
  const savedCount = disc.songs.filter(s => s.id).length
  const newCount = Math.max(savedCount, Math.min(99, pendingTrackCounts[discId] ?? disc.songs.length))
  // Clamp input display to minimum if user tried to go below
  if (newCount !== (pendingTrackCounts[discId] ?? disc.songs.length)) {
    pendingTrackCounts[discId] = newCount
  }
  const currentCount = disc.songs.length
  if (newCount === currentCount) return

  if (newCount < currentCount) {
    askConfirm(
      '减少曲目',
      `当前有 ${currentCount} 首曲目，设定为 ${newCount} 首将删除末尾 ${currentCount - newCount} 首。确认继续？`,
      () => doSetTrackCount(discIndex, discId, newCount),
    )
  }
  else {
    doSetTrackCount(discIndex, discId, newCount)
  }
}

const removeTrack = (discIndex: number, trackIndex: number) => {
  const newStructure = props.formData.structure.map((d, di) => {
    if (di !== discIndex) return d
    const songs = d.songs
      .filter((_, si) => si !== trackIndex)
      .map((s, si) => ({ ...s, track_number: si + 1 }))
    return { ...d, songs }
  })
  emit('update:formData', { ...props.formData, structure: newStructure })
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

const confirmDialog = reactive({
  show: false,
  title: '',
  description: '',
  onConfirm: () => {},
})

function askConfirm(title: string, description: string, onConfirm: () => void) {
  confirmDialog.title = title
  confirmDialog.description = description
  confirmDialog.onConfirm = onConfirm
  confirmDialog.show = true
}
</script>
