<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Discs & Tracks</h2>
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1"
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
              <span class="text-xs text-gray-400">如果是特典，并且不需要记录专辑音乐统计总数，请不要勾选。不懂保持勾选即可。</span>
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
              <div class="dropdown dropdown-end">
                <button tabindex="0" type="button" class="btn btn-xs btn-outline gap-1">
                  <Upload :size="12" />
                  快速导入
                </button>
                <ul tabindex="0" class="dropdown-content z-10 menu menu-xs shadow bg-white rounded-lg border border-gray-200 w-36 p-1">
                  <li><a @mousedown.prevent="openImportTextDialog(discIndex)">从文本导入</a></li>
                  <li><a @mousedown.prevent="openImportCueDialog(discIndex)">从 CUE 导入</a></li>
                </ul>
              </div>
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

    <!-- Add Disc Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAddDiscForm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @mousedown.self="closeAddDiscForm"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <Transition
            enter-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showAddDiscForm" class="relative z-10 w-full max-w-xs bg-white rounded-2xl shadow-xl p-6">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Disc3 :size="18" class="text-primary" />
              </div>
              <h3 class="text-base font-semibold text-gray-900 mb-1">添加碟片</h3>
              <p class="text-sm text-gray-500 mb-4">请输入这张碟片的曲目数量。</p>
              <input
                ref="trackCountInputRef"
                v-model.number="newDiscTrackCount"
                type="number"
                min="1"
                max="99"
                placeholder="e.g., 12"
                class="input input-bordered input-sm w-full"
                @keydown.enter="confirmAddDisc"
              />
              <div class="flex gap-2 mt-5 justify-end">
                <button type="button" class="btn btn-sm btn-ghost text-gray-500" @click="closeAddDiscForm">
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="!newDiscTrackCount || newDiscTrackCount < 1"
                  @click="confirmAddDisc"
                >
                  确认
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Import from Text Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="importTextDialog.show"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @mousedown.self="importTextDialog.show = false"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <Transition
            enter-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="importTextDialog.show" class="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
              <h3 class="text-base font-semibold text-gray-900 mb-1">从文本导入标题</h3>
              <p class="text-sm text-gray-500 mb-4">每行输入一个曲目标题，按顺序填入对应曲目。</p>
              <textarea
                ref="importTextareaRef"
                v-model="importTextDialog.text"
                rows="8"
                placeholder="曲目一&#10;曲目二&#10;曲目三"
                class="textarea textarea-bordered w-full text-sm bg-gray-50 resize-none"
                @keydown.ctrl.enter="confirmImportText"
              />
              <div class="flex gap-2 mt-5 justify-end">
                <button type="button" class="btn btn-sm btn-ghost text-gray-500" @click="importTextDialog.show = false">
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="!importTextDialog.text.trim()"
                  @click="confirmImportText"
                >
                  确认导入
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Import from CUE Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="importCueDialog.show"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @mousedown.self="importCueDialog.show = false"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <Transition
            enter-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="importCueDialog.show" class="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
              <h3 class="text-base font-semibold text-gray-900 mb-1">从 CUE 导入标题</h3>
              <p class="text-sm text-gray-500 mb-4">将 CUE 文件内容粘贴至此，将自动提取各曲目标题。</p>
              <textarea
                ref="importCueTextareaRef"
                v-model="importCueDialog.text"
                rows="10"
                placeholder="粘贴 CUE 内容…"
                class="textarea textarea-bordered w-full text-sm bg-gray-50 resize-none font-mono"
                @keydown.ctrl.enter="confirmImportCue"
              />
              <div class="flex gap-2 mt-5 justify-end">
                <button type="button" class="btn btn-sm btn-ghost text-gray-500" @click="importCueDialog.show = false">
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="!importCueDialog.text.trim()"
                  @click="confirmImportCue"
                >
                  确认导入
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm Dialog -->
    <CommonConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :variant="confirmDialog.variant"
      @confirm="confirmDialog.onConfirm()"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, X, Disc3, Upload } from 'lucide-vue-next'

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
const newDiscTrackCount = ref(12)

let discIdCounter = 0

function openAddDiscForm() {
  newDiscTrackCount.value = 12
  showAddDiscForm.value = true
  nextTick(() => trackCountInputRef.value?.focus())
}

function closeAddDiscForm() {
  showAddDiscForm.value = false
}

function confirmAddDisc() {
  const count = Math.max(1, Math.min(99, newDiscTrackCount.value || 1))
  const songs: Song[] = Array.from({ length: count }, (_, i) => ({
    track_number: i + 1,
    title: '',
    duration: 0,
    is_instrumental: false,
  }))

  const newDisc: Disc = {
    id: `disc-${discIdCounter++}`,
    disc_number: props.formData.structure.length + 1,
    title: null,
    catalog_number: null,
    length: null,
    is_bonus: false,
    is_counted: true,
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
  const newCount = Math.max(0, Math.min(99, pendingTrackCounts[discId] ?? disc.songs.length))
  const currentCount = disc.songs.length
  if (newCount === currentCount) return

  if (newCount < currentCount) {
    const savedCount = disc.songs.filter(s => s.id).length
    if (newCount < savedCount) {
      // Cannot delete saved songs — reset input and show warning only
      pendingTrackCounts[discId] = savedCount
      askConfirm(
        '无法减少曲目',
        `已有 ${savedCount} 首曲目保存在数据库中，无法将总数设定为更少。如需删除已保存的曲目，请联系管理员。`,
        () => {},
        'warning',
      )
      return
    }
    askConfirm(
      '减少曲目',
      `当前有 ${currentCount} 首曲目，设定为 ${newCount} 首将删除末尾 ${currentCount - newCount} 首未保存的曲目。确认继续？`,
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

// ─── Quick import ─────────────────────────────────────────────────────────────

function applyTitles(discIndex: number, titles: string[]) {
  const newStructure = props.formData.structure.map((d, di) => {
    if (di !== discIndex) return d
    return {
      ...d,
      songs: d.songs.map((s, si) =>
        titles[si] !== undefined ? { ...s, title: titles[si]! } : s
      ),
    }
  })
  emit('update:formData', { ...props.formData, structure: newStructure })
}

// — Text import —

const importTextDialog = reactive({
  show: false,
  discIndex: -1,
  text: '',
})
const importTextareaRef = ref<HTMLTextAreaElement | null>(null)

function openImportTextDialog(discIndex: number) {
  importTextDialog.discIndex = discIndex
  importTextDialog.text = ''
  importTextDialog.show = true
  nextTick(() => importTextareaRef.value?.focus())
}

function confirmImportText() {
  const titles = importTextDialog.text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
  applyTitles(importTextDialog.discIndex, titles)
  importTextDialog.show = false
}

// — CUE import —

const importCueDialog = reactive({
  show: false,
  discIndex: -1,
  text: '',
})
const importCueTextareaRef = ref<HTMLTextAreaElement | null>(null)

function openImportCueDialog(discIndex: number) {
  importCueDialog.discIndex = discIndex
  importCueDialog.text = ''
  importCueDialog.show = true
  nextTick(() => importCueTextareaRef.value?.focus())
}

function parseCueTitles(cue: string): string[] {
  const titles: string[] = []
  const trackBlocks = cue.split(/\bTRACK\s+\d+\s+AUDIO\b/i).slice(1)
  for (const block of trackBlocks) {
    const match = block.match(/^\s*TITLE\s+"([^"]+)"/im)
    titles.push(match ? match[1]! : '')
  }
  return titles
}

function confirmImportCue() {
  const titles = parseCueTitles(importCueDialog.text).filter(t => t.length > 0)
  applyTitles(importCueDialog.discIndex, titles)
  importCueDialog.show = false
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

const confirmDialog = reactive<{
  show: boolean
  title: string
  description: string
  variant: 'delete' | 'warning'
  onConfirm: () => void
}>({
  show: false,
  title: '',
  description: '',
  variant: 'delete',
  onConfirm: () => {},
})

function askConfirm(title: string, description: string, onConfirm: () => void, variant: 'delete' | 'warning' = 'delete') {
  confirmDialog.title = title
  confirmDialog.description = description
  confirmDialog.onConfirm = onConfirm
  confirmDialog.variant = variant
  confirmDialog.show = true
}
</script>
