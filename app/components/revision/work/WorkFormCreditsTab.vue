<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Credits</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        先添加参与创作的艺术家，再点击头像为其指定角色和适用曲目。
      </p>
    </div>

    <!-- 艺术家池 -->
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">

      <!-- 艺术家网格 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <!-- 艺术家卡片 -->
        <div
          v-for="artistId in artistPool"
          :key="artistId"
          class="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-white border cursor-pointer transition-all"
          :class="selectedArtistId === artistId
            ? 'border-primary ring-2 ring-primary/20 shadow-sm'
            : 'border-gray-100 hover:border-primary/40'"
          @click="selectArtist(artistId)"
        >
          <!-- 左上：ID -->
          <span class="absolute top-1.5 left-1.5 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 leading-none">
            ID: {{ artistId }}
          </span>

          <!-- 右上：移除按钮 -->
          <button
            type="button"
            class="absolute top-1.5 right-1.5 btn btn-xs btn-ghost text-gray-300 hover:text-error hover:bg-error/10 p-0 min-h-0 h-5 w-5"
            @click.stop="removeArtistFromPool(artistId)"
          >
            <X :size="12" />
          </button>

          <!-- 右下：已添加次数 -->
          <span
            class="absolute bottom-1.5 right-1.5 text-[10px] font-medium leading-none px-1.5 py-0.5 rounded border"
            :class="creditsForArtist(artistId).length > 0
              ? 'text-primary bg-primary/10 border-primary/20'
              : 'text-gray-400 bg-gray-50 border-gray-200'"
          >
            {{ creditsForArtist(artistId).length }} 次
          </span>

          <!-- 头像 -->
          <div class="w-14 h-14 mt-4 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0">
            <img
              v-if="artistInfoMap[artistId]?.image_url"
              :src="artistInfoMap[artistId]!.image_url"
              :alt="artistInfoMap[artistId]?.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-400">
              {{ artistId }}
            </div>
          </div>

          <!-- 姓名 -->
          <p class="text-xs font-medium text-gray-800 truncate w-full text-center pb-4">
            {{ artistInfoMap[artistId]?.name ?? artistId }}
          </p>
        </div>

        <!-- 添加艺术家 tile -->
        <button
          type="button"
          class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed text-gray-400 transition-colors min-h-28"
          :class="showAddPanel
            ? 'border-primary text-primary bg-primary/5'
            : 'border-gray-200 hover:border-primary hover:text-primary'"
          @click="toggleAddPanel"
        >
          <UserPlus :size="20" />
          <span class="text-xs">添加艺术家</span>
        </button>
      </div>

      <!-- 添加艺术家搜索面板 -->
      <Transition name="slide-down">
        <div v-if="showAddPanel" class="bg-white rounded-xl border border-primary/20 p-4 space-y-3">
          <!-- 搜索输入 -->
          <div class="flex gap-2">
            <input
              ref="searchInputRef"
              v-model="searchId"
              type="text"
              placeholder="输入艺术家 ID（数字）"
              class="input input-bordered input-sm flex-1"
              @keydown.enter.prevent="lookupArtist"
            />
            <button
              type="button"
              class="btn btn-sm btn-primary gap-1"
              :disabled="!searchId.trim() || searchLoading"
              @click="lookupArtist"
            >
              <span v-if="searchLoading" class="loading loading-spinner loading-xs" />
              <Search v-else :size="14" />
              查询
            </button>
            <button type="button" class="btn btn-sm btn-ghost text-gray-400" @click="closeAddPanel">
              <X :size="14" />
            </button>
          </div>

          <!-- 错误 -->
          <p v-if="searchError" class="text-xs text-error">{{ searchError }}</p>

          <!-- 预览 -->
          <div v-if="previewArtist" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
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
              <button type="button" class="btn btn-sm btn-primary gap-1" @click="confirmAddArtist">
                <Plus :size="13" />
                添加
              </button>
              <button type="button" class="btn btn-sm btn-ghost text-gray-400" @click="previewArtist = null; searchId = ''">
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 空状态 -->
      <div v-if="artistPool.length === 0 && !showAddPanel" class="text-center py-4 text-sm text-gray-400">
        点击「添加艺术家」开始添加创作人员
      </div>
    </div>

    <!-- Credit 配置面板（点击艺术家后显示） -->
    <Transition name="slide-down">
      <div v-if="selectedArtistId" class="rounded-xl border border-primary/30 bg-white shadow-sm overflow-hidden">

        <!-- 面板头部 -->
        <div class="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-primary/20">
          <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
            <img
              v-if="artistInfoMap[selectedArtistId]?.image_url"
              :src="artistInfoMap[selectedArtistId]!.image_url"
              class="w-full h-full object-cover"
            />
          </div>
          <p class="font-semibold text-gray-800 flex-1">
            {{ artistInfoMap[selectedArtistId]?.name ?? selectedArtistId }}
          </p>
          <button type="button" class="btn btn-xs btn-ghost text-gray-400" @click="selectedArtistId = null">
            <X :size="14" />
          </button>
        </div>

        <div class="p-4 space-y-4">

          <!-- 现有 Credits -->
          <div v-if="creditsForArtist(selectedArtistId).length > 0" class="space-y-2">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">现有 Credits</p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="credit in creditsForArtist(selectedArtistId)"
                :key="credit.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700"
              >
                <!-- 范围标签 -->
                <span class="font-semibold text-primary">
                  {{ credit.track ? credit.track : '专辑' }}
                </span>
                <span class="text-gray-400">·</span>
                <span>{{ credit.role }}</span>
                <button
                  type="button"
                  class="text-gray-300 hover:text-error transition-colors ml-0.5"
                  @click="removeCredit(credit.id)"
                >
                  <X :size="11" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400 italic">
            该艺术家暂无 Credit，请在下方添加。
          </div>

          <!-- 分割线 -->
          <div class="border-t border-gray-100" />

          <!-- 添加新 Credit 表单 -->
          <div class="space-y-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">添加 Credit</p>

            <!-- Role 输入 -->
            <div class="form-control">
              <label class="label py-0.5">
                <span class="label-text text-xs font-medium">角色 Role</span>
              </label>
              <input
                ref="roleInputRef"
                v-model="newRole"
                type="text"
                placeholder="如：作曲、Vocal、编曲、Mix"
                class="input input-bordered input-sm w-full"
                @keydown.enter.prevent="addCreditForSelected"
              />
            </div>

            <!-- 范围选择 -->
            <div class="form-control">
              <label class="label py-0.5">
                <span class="label-text text-xs font-medium">适用范围</span>
              </label>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2 py-0">
                  <input v-model="newTarget" type="radio" value="album" class="radio radio-sm radio-primary" />
                  <span class="label-text text-sm">专辑</span>
                </label>
                <label class="label cursor-pointer gap-2 py-0">
                  <input v-model="newTarget" type="radio" value="tracks" class="radio radio-sm radio-primary" />
                  <span class="label-text text-sm">指定曲目</span>
                </label>
              </div>
            </div>

            <!-- 曲目输入（指定曲目时显示） -->
            <Transition name="slide-down">
              <div v-if="newTarget === 'tracks'" class="space-y-1.5">
                <!-- 快速选择（从现有曲目结构中） -->
                <div v-if="hasStructure" class="space-y-1">
                  <p class="text-[10px] text-gray-400">从曲目列表选择（可多选）</p>
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="tk in allTrackKeys"
                      :key="tk.key"
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors"
                      :class="selectedTrackKeys.has(tk.key)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'"
                      @click="toggleTrackKey(tk.key)"
                    >
                      {{ tk.key }}
                      <span class="opacity-60 max-w-15 truncate">{{ tk.title }}</span>
                    </button>
                  </div>
                </div>

                <!-- 手动输入 -->
                <div class="form-control">
                  <label class="label py-0.5">
                    <span class="label-text text-xs">{{ hasStructure ? '或手动输入' : '曲目编号' }}</span>
                  </label>
                  <input
                    v-model="newTracksInput"
                    type="text"
                    placeholder="如：1.1, 1.2, 1.3, 2.5"
                    class="input input-bordered input-sm w-full font-mono"
                  />
                  <label class="label py-0.5">
                    <span class="label-text-alt text-gray-400">格式：碟号.曲号，逗号分隔，如 1.1,1.2,2.3</span>
                  </label>
                </div>

                <!-- 已选曲目预览 -->
                <div v-if="parsedTrackKeys.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="tk in parsedTrackKeys"
                    :key="tk"
                    class="badge badge-sm badge-primary badge-outline"
                  >{{ tk }}</span>
                </div>
                <p v-else-if="newTracksInput.trim() || selectedTrackKeys.size > 0" class="text-xs text-warning">
                  请输入有效格式（如 1.1, 1.2）
                </p>
              </div>
            </Transition>

            <!-- 提交按钮 -->
            <button
              type="button"
              class="btn btn-sm btn-primary w-full gap-1.5"
              :disabled="!canAddCredit"
              @click="addCreditForSelected"
            >
              <Plus :size="14" />
              确认添加
              <span v-if="newTarget === 'tracks' && parsedTrackKeys.length > 1" class="opacity-80">
                （{{ parsedTrackKeys.length }} 条）
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 专辑 Staff 总览 -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <Disc3 :size="15" class="text-gray-400" />
        <h3 class="font-semibold text-gray-700 text-sm">专辑 Staff 总览</h3>
        <span v-if="albumCreditsForTrack.length > 0" class="badge badge-sm badge-ghost">{{ albumCreditsForTrack.length }}</span>
      </div>

      <div v-if="albumCreditsForTrack.length === 0" class="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
        暂无专辑 Credit
      </div>

      <div v-else class="rounded-xl border border-gray-200 overflow-hidden">
        <div
          v-for="(group, role) in albumCreditsByRole"
          :key="role"
          class="flex items-start gap-4 px-4 py-2.5 border-b border-gray-100 last:border-b-0"
        >
          <!-- Role 标签 -->
          <span class="text-xs font-semibold text-gray-500 w-24 shrink-0 pt-0.5">{{ role }}</span>
          <!-- 艺术家列表 -->
          <div class="flex flex-wrap gap-1.5 flex-1">
            <div
              v-for="credit in group"
              :key="credit.id"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-700"
            >
              <div class="w-4 h-4 rounded-full overflow-hidden bg-gray-200 shrink-0">
                <img
                  v-if="artistInfoMap[credit.artist_id]?.image_url"
                  :src="artistInfoMap[credit.artist_id]!.image_url"
                  class="w-full h-full object-cover"
                />
              </div>
              <span>{{ artistInfoMap[credit.artist_id]?.name ?? credit.artist_id }}</span>
              <button
                type="button"
                class="text-gray-300 hover:text-error transition-colors leading-none"
                @click="removeCredit(credit.id)"
              >×</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 曲目 Staff 总览 -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <Music :size="15" class="text-gray-400" />
        <h3 class="font-semibold text-gray-700 text-sm">曲目 Staff 总览</h3>
      </div>

      <!-- 无曲目结构 -->
      <div
        v-if="!hasStructure"
        class="rounded-xl border-2 border-dashed border-gray-200 py-8 flex flex-col items-center text-gray-400 gap-2"
      >
        <ListMusic :size="26" class="opacity-40" />
        <p class="text-sm">请先在「Discs & Tracks」标签页中添加曲目</p>
      </div>

      <!-- Disc 手风琴 -->
      <div
        v-for="disc in formData.structure"
        v-else
        :key="disc.id"
        class="rounded-xl border border-gray-200 overflow-hidden"
      >
        <!-- Disc 标题行 -->
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          @click="discExpanded[disc.id] = !discExpanded[disc.id]"
        >
          <ChevronDown
            :size="14"
            class="text-gray-400 transition-transform duration-200 shrink-0"
            :class="{ '-rotate-90': !discExpanded[disc.id] }"
          />
          <span class="font-semibold text-gray-700 text-sm">Disc {{ disc.disc_number }}</span>
          <span v-if="disc.title" class="text-sm text-gray-400">— {{ disc.title }}</span>
          <span
            v-if="trackCreditsCountForDisc(disc) > 0"
            class="badge badge-sm badge-ghost text-[10px] ml-auto"
          >{{ trackCreditsCountForDisc(disc) }} credits</span>
        </button>

        <!-- Track 列表 -->
        <div v-show="discExpanded[disc.id]" class="divide-y divide-gray-100">
          <div v-if="disc.songs.length === 0" class="px-4 py-4 text-center text-sm text-gray-400">
            该碟片暂无曲目
          </div>

          <div v-for="song in disc.songs" :key="song.id" class="px-4 py-2.5 flex items-start gap-3">
            <!-- 曲号 -->
            <span class="text-sm text-gray-400 w-5 text-right shrink-0 mt-0.5">{{ song.track_number }}.</span>

            <!-- 曲名 -->
            <span class="text-sm text-gray-700 w-32 shrink-0 truncate mt-0.5">{{ song.title || '(未命名)' }}</span>

            <!-- Credits chips -->
            <div class="flex flex-wrap gap-1 flex-1">
              <template v-if="(trackCreditsMap[`${disc.disc_number}.${song.track_number}`] ?? []).length > 0">
                <div
                  v-for="credit in trackCreditsMap[`${disc.disc_number}.${song.track_number}`]"
                  :key="credit.id"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20"
                >
                  <span class="font-semibold">{{ credit.role }}</span>
                  <span class="text-primary/70">{{ artistInfoMap[credit.artist_id]?.name ?? credit.artist_id }}</span>
                  <button
                    type="button"
                    class="text-primary/40 hover:text-error transition-colors leading-none"
                    @click="removeCredit(credit.id)"
                  >×</button>
                </div>
              </template>
              <!-- 专辑 credits 也显示在每行（灰色区分） -->
              <template v-if="albumCreditsForTrack.length > 0">
                <div
                  v-for="credit in albumCreditsForTrack"
                  :key="`album-${credit.id}`"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500 border border-gray-200"
                  title="专辑 Credit（适用所有曲目）"
                >
                  <span class="font-semibold">{{ credit.role }}</span>
                  <span class="opacity-70">{{ artistInfoMap[credit.artist_id]?.name ?? credit.artist_id }}</span>
                </div>
              </template>
              <span v-if="(trackCreditsMap[`${disc.disc_number}.${song.track_number}`] ?? []).length === 0 && albumCreditsForTrack.length === 0" class="text-[10px] text-gray-300 italic">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, X, Search, Users, UserPlus, ChevronDown, Music, ListMusic, Disc3 } from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ArtistInfo {
  id: number | string
  name: string
  image_url?: string
}

interface Credit {
  id: string
  credit_id?: number
  artist_id: string
  display_name: string
  role: string
  track: string
}

interface Song {
  id: string | number
  track_number: number
  title: string
  duration: string
  is_instrumental: boolean
}

interface Disc {
  id: string
  disc_number: number
  title: string | null
  songs: Song[]
  [key: string]: unknown
}

interface FormData {
  credits: Credit[]
  structure: Disc[]
  artists?: Array<{ artist_id: string; [key: string]: unknown }>
  [key: string]: unknown
}

// ── Props / Emits ──────────────────────────────────────────────────────────────

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

const { $api } = useNuxtApp()

// ── Artist info cache ──────────────────────────────────────────────────────────

const artistInfoMap = reactive<Record<string, ArtistInfo>>({})

// ── Artist pool (ordered list of artist IDs in the credits section) ────────────

const artistPool = ref<string[]>([])

// ── Selected artist (for credit config panel) ──────────────────────────────────

const selectedArtistId = ref<string | null>(null)

// ── Add artist panel state ─────────────────────────────────────────────────────

const showAddPanel = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchId = ref('')
const searchLoading = ref(false)
const searchError = ref('')
const previewArtist = ref<ArtistInfo | null>(null)

// ── Credit add form state ──────────────────────────────────────────────────────

const roleInputRef = ref<HTMLInputElement | null>(null)
const newRole = ref('')
const newTarget = ref<'album' | 'tracks'>('album')
const newTracksInput = ref('')
const selectedTrackKeys = ref(new Set<string>())

// ── ID counter ─────────────────────────────────────────────────────────────────

let creditIdCounter = 0

// ── Computed: structure helpers ────────────────────────────────────────────────

const hasStructure = computed(() =>
  props.formData.structure.some(d => d.songs.length > 0)
)

const allTrackKeys = computed(() => {
  const result: { key: string; title: string }[] = []
  for (const disc of props.formData.structure) {
    for (const song of disc.songs) {
      result.push({
        key: `${disc.disc_number}.${song.track_number}`,
        title: song.title,
      })
    }
  }
  return result
})

// Combine quick-select toggles + manual text input, deduplicated
const parsedTrackKeys = computed(() => {
  const manual = newTracksInput.value
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(s => /^\d+\.\d+$/.test(s))
  const all = [...selectedTrackKeys.value, ...manual]
  return [...new Set(all)].sort((a, b) => {
    const [ad = 0, at = 0] = a.split('.').map(Number)
    const [bd = 0, bt = 0] = b.split('.').map(Number)
    return ad !== bd ? ad - bd : at - bt
  })
})

const canAddCredit = computed(() => {
  if (!newRole.value.trim()) return false
  if (newTarget.value === 'tracks') return parsedTrackKeys.value.length > 0
  return true
})

// ── Computed: credits per artist ───────────────────────────────────────────────

const creditsForArtist = (artistId: string) =>
  props.formData.credits.filter(c => c.artist_id === artistId)

// ── Computed: track overview helpers ──────────────────────────────────────────

// Credits indexed by track key string (only per-track credits, track !== "")
const trackCreditsMap = computed(() => {
  const map: Record<string, Credit[]> = {}
  for (const c of props.formData.credits) {
    if (c.track) {
      if (!map[c.track]) map[c.track] = []
      map[c.track]!.push(c)
    }
  }
  return map
})

// Album-level credits (shown on every track row as context)
const albumCreditsForTrack = computed(() =>
  props.formData.credits.filter(c => c.track === '')
)

const albumCreditsByRole = computed(() => {
  const map: Record<string, Credit[]> = {}
  for (const c of albumCreditsForTrack.value) {
    if (!map[c.role]) map[c.role] = []
    map[c.role]!.push(c)
  }
  return map
})

const trackCreditsCountForDisc = (disc: Disc): number => {
  let count = 0
  for (const song of disc.songs) {
    count += (trackCreditsMap.value[`${disc.disc_number}.${song.track_number}`] ?? []).length
  }
  return count
}

// ── Disc collapse state ────────────────────────────────────────────────────────

const discExpanded = reactive<Record<string, boolean>>({})

// ── Track key toggle (quick select buttons) ────────────────────────────────────

const toggleTrackKey = (key: string) => {
  const next = new Set(selectedTrackKeys.value)
  next.has(key) ? next.delete(key) : next.add(key)
  selectedTrackKeys.value = next
}

// ── Artist lookup ──────────────────────────────────────────────────────────────

const batchLookup = async (ids: string[]) => {
  if (ids.length === 0) return
  try {
    const result = await $api(`/v1/artists/lookup?ids=${ids.join(',')}`)
    const list: ArtistInfo[] = (result as { artists: ArtistInfo[] }).artists ?? []
    for (const artist of list) {
      artistInfoMap[String(artist.id)] = artist
    }
  } catch {
    // silently ignore
  }
}

const lookupArtist = async () => {
  const id = searchId.value.trim()
  if (!id) return

  if (artistInfoMap[id]) {
    previewArtist.value = artistInfoMap[id]!
    searchError.value = ''
    return
  }

  searchLoading.value = true
  searchError.value = ''
  previewArtist.value = null

  try {
    const result = await $api(`/v1/artists/lookup?ids=${id}`)
    const list: ArtistInfo[] = (result as { artists: ArtistInfo[] }).artists ?? []
    const found = list.find(a => String(a.id) === id)
    if (!found) {
      searchError.value = `未找到 ID 为 ${id} 的艺术家`
      return
    }
    artistInfoMap[id] = found
    previewArtist.value = found
  } catch {
    searchError.value = '查询失败，请检查 ID 是否正确'
  } finally {
    searchLoading.value = false
  }
}

// ── Add artist to pool ─────────────────────────────────────────────────────────

const confirmAddArtist = () => {
  if (!previewArtist.value) return
  const id = String(previewArtist.value.id)
  if (!artistPool.value.includes(id)) {
    artistPool.value.push(id)
  }
  closeAddPanel()
  // Auto-select the newly added artist
  nextTick(() => selectArtist(id))
}

// ── Remove artist from pool ────────────────────────────────────────────────────

const removeArtistFromPool = (artistId: string) => {
  artistPool.value = artistPool.value.filter(id => id !== artistId)
  // Also remove all their credits
  const newCredits = props.formData.credits.filter(c => c.artist_id !== artistId)
  emit('update:formData', { ...props.formData, credits: newCredits })
  if (selectedArtistId.value === artistId) selectedArtistId.value = null
}

// ── Select artist → open config panel ─────────────────────────────────────────

const selectArtist = (artistId: string) => {
  if (selectedArtistId.value === artistId) {
    selectedArtistId.value = null
    return
  }
  showAddPanel.value = false
  selectedArtistId.value = artistId
  newRole.value = ''
  newTarget.value = 'album'
  newTracksInput.value = ''
  selectedTrackKeys.value = new Set()
  nextTick(() => roleInputRef.value?.focus())
}

// ── Add credit for selected artist ────────────────────────────────────────────

const addCreditForSelected = () => {
  if (!selectedArtistId.value || !canAddCredit.value) return

  const role = newRole.value.trim()
  const artistId = selectedArtistId.value

  let newCredits: Credit[]

  if (newTarget.value === 'album') {
    newCredits = [
      ...props.formData.credits,
      {
        id: `credit-${creditIdCounter++}`,
        artist_id: artistId,
        display_name: '',
        role,
        track: '',
      },
    ]
  } else {
    const additions: Credit[] = parsedTrackKeys.value.map(tk => ({
      id: `credit-${creditIdCounter++}`,
      artist_id: artistId,
      display_name: '',
      role,
      track: tk,
    }))
    newCredits = [...props.formData.credits, ...additions]
  }

  emit('update:formData', { ...props.formData, credits: newCredits })

  // Reset form for next entry
  newRole.value = ''
  newTarget.value = 'album'
  newTracksInput.value = ''
  selectedTrackKeys.value = new Set()
  nextTick(() => roleInputRef.value?.focus())
}

// ── Remove single credit ───────────────────────────────────────────────────────

const removeCredit = (creditId: string) => {
  const newCredits = props.formData.credits.filter(c => c.id !== creditId)
  emit('update:formData', { ...props.formData, credits: newCredits })
}

// ── Add panel open / close ─────────────────────────────────────────────────────

const toggleAddPanel = () => {
  if (showAddPanel.value) {
    closeAddPanel()
    return
  }
  selectedArtistId.value = null
  showAddPanel.value = true
  searchId.value = ''
  searchError.value = ''
  previewArtist.value = null
  nextTick(() => searchInputRef.value?.focus())
}

const closeAddPanel = () => {
  showAddPanel.value = false
  searchId.value = ''
  searchError.value = ''
  previewArtist.value = null
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Build artist pool from existing credits
  const creditIds = [...new Set(props.formData.credits.map(c => c.artist_id).filter(Boolean))]
  artistPool.value = creditIds

  // Batch lookup: credits + associated artists
  const associatedIds = (props.formData.artists ?? []).map(a => a.artist_id)
  const allIds = [...new Set([...creditIds, ...associatedIds].filter(Boolean))]
  await batchLookup(allIds)

  // Initialize disc expand state
  for (const disc of props.formData.structure) {
    if (discExpanded[disc.id] === undefined) discExpanded[disc.id] = true
  }
})

watch(
  () => props.formData.structure,
  (structure) => {
    for (const disc of structure) {
      if (discExpanded[disc.id] === undefined) discExpanded[disc.id] = true
    }
  },
  { deep: true }
)

watch(
  () => props.formData.credits,
  async (credits) => {
    // Sync any new artist IDs into the pool
    for (const c of credits) {
      if (c.artist_id && !artistPool.value.includes(c.artist_id)) {
        artistPool.value.push(c.artist_id)
      }
    }
    // Lookup unknown artists
    const missing = [...new Set(credits.map(c => c.artist_id))].filter(
      id => id && !artistInfoMap[id]
    )
    if (missing.length > 0) await batchLookup(missing)
  },
  { deep: true }
)
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 800px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
