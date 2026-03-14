<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <ListMusic :size="16" class="text-indigo-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">Tracklist</h2>
      <!-- Credit toggle -->
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-gray-400 flex items-center gap-1">
          <Users :size="12" />
          人员信息
        </span>
        <button
          type="button"
          @click="showCredits = !showCredits"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
          :class="showCredits ? 'bg-indigo-500' : 'bg-gray-200'"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform"
            :class="showCredits ? 'translate-x-4.5' : 'translate-x-0.75'"
          />
        </button>
      </div>
    </div>

    <div v-if="discs.length">
      <template v-for="(disc, discIdx) in discs" :key="disc.discNumber">
        <!-- Disc label (only when multiple discs) -->
        <div v-if="discs.length > 1" class="px-4 sm:px-5 py-2 bg-gray-50 border-b border-gray-100">
          <!-- Main row -->
          <div class="flex items-center gap-2">
            <Disc3 :size="12" class="text-gray-400 shrink-0" />
            <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Disc {{ disc.discNumber }}</span>
            <!-- Title inline on sm+ -->
            <span v-if="disc.title" class="hidden sm:inline text-[11px] text-gray-400 truncate">— {{ disc.title }}</span>
            <!-- is_bonus badge -->
            <div v-if="disc.isBonus" class="tooltip tooltip-bottom" data-tip="这是特典内容">
              <span class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-pink-100 text-pink-600 cursor-default select-none">特典</span>
            </div>
            <!-- is_counted badge -->
            <div v-if="!disc.isCounted" class="tooltip tooltip-bottom" data-tip="不计入专辑曲目总数">
              <span class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-gray-200 text-gray-500 cursor-default select-none">附加内容</span>
            </div>
            <span class="ml-auto px-1.5 py-0.5 text-[10px] font-bold tabular-nums rounded-full bg-gray-200/80 text-gray-500 shrink-0">{{ disc.tracks.length }}</span>
          </div>
          <!-- Title on its own line on mobile -->
          <p v-if="disc.title" class="sm:hidden text-[11px] text-gray-400 mt-0.5 pl-4.5">{{ disc.title }}</p>
        </div>

        <!-- Track rows -->
        <div
          v-for="track in disc.tracks"
          :key="track.uid"
          class="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 hover:bg-indigo-50/50 transition-all duration-150 border-b border-gray-100 last:border-b-0 group"
        >
          <!-- Track number -->
          <span class="text-gray-400 group-hover:text-indigo-500 font-mono font-bold text-xs w-6 text-right shrink-0 select-none transition-colors duration-150">{{ track.displayNumber }}</span>

          <!-- Heart -->
          <button
            v-if="track.songId"
            type="button"
            :disabled="!!toggleLoading[track.songId]"
            @click="handleToggleFavorite(track.songId)"
            class="shrink-0 p-1 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed sm:opacity-0 sm:group-hover:opacity-100"
            :class="{ 'sm:opacity-100!': favoritedSongs[track.songId] }"
            :title="favoritedSongs[track.songId] ? '取消收藏' : '收藏'"
          >
            <Heart
              :size="14"
              :fill="favoritedSongs[track.songId] ? 'currentColor' : 'none'"
              :class="favoritedSongs[track.songId] ? 'text-red-500' : 'text-gray-400'"
            />
          </button>
          <div v-else class="w-6 shrink-0" />

          <!-- Title + meta -->
          <div class="flex-1 min-w-0">
            <!-- 第一行：纯音乐图标 + 标题 -->
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-sm font-medium text-gray-900 leading-snug">{{ track.title }}</p>
              <div v-if="track.isInstrumental" class="tooltip tooltip-bottom shrink-0" data-tip="纯音乐">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-600">
                  <Music2 :size="11" :stroke-width="2.5" />
                </span>
              </div>
            </div>
            <!-- 第二行：subtitle -->
            <p v-if="track.subtitle" class="text-xs text-gray-400 mt-0.5 pl-4.5 truncate">{{ track.subtitle }}</p>
            <!-- Credits -->
            <div
              v-if="showCredits && (track.artist || track.credits?.length)"
              class="mt-2 pt-2 border-t border-gray-100 space-y-1 text-xs"
            >
              <div v-if="track.artist" class="flex items-baseline gap-2">
                <span class="shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500">
                  Artist
                </span>
                <span class="text-gray-600">{{ track.artist }}</span>
              </div>
              <div v-for="(credit, idx) in track.credits" :key="idx" class="flex items-baseline gap-2">
                <span :class="['shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold', roleBadgeClass(credit.role)]">
                  {{ credit.role }}
                </span>
                <span class="text-gray-600">
                  <template v-for="(artist, artistIdx) in credit.artists" :key="artistIdx">
                    <NuxtLink
                      v-if="artist.artistId"
                      :to="`/artists/${artist.artistId}`"
                      class="hover:underline hover:text-gray-800 transition-colors"
                    >{{ artist.name }}</NuxtLink>
                    <span v-else>{{ artist.name }}</span>
                    <span v-if="artistIdx < credit.artists.length - 1">, </span>
                  </template>
                </span>
              </div>
            </div>
          </div>

          <!-- Duration + 歌词/翻译 -->
          <div class="shrink-0 flex flex-col items-center sm:items-end justify-center gap-1">
            <span class="text-xs text-gray-400 tabular-nums">{{ track.duration }}</span>
            <div v-if="!track.isInstrumental" class="flex items-center gap-1">
              <button
                type="button"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors"
                :class="track.hasLyrics ? 'bg-sky-50 text-sky-500 hover:bg-sky-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                @click.stop="openLyrics(track)"
              >
                <FileText :size="10" /><span class="hidden sm:inline">歌词</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors"
                :class="track.translationsCount > 0 ? 'bg-teal-50 text-teal-500 hover:bg-teal-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                @click.stop="openTranslations(track)"
              >
                <Languages :size="10" /><span class="hidden sm:inline">翻译{{ track.translationsCount > 0 ? ` ${track.translationsCount}` : '' }}</span><span v-if="track.translationsCount > 0" class="sm:hidden">{{ track.translationsCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="discIdx < discs.length - 1" class="border-b border-gray-100" />
      </template>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-6">
      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
        <ListMusic :size="15" class="text-indigo-400" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-600">暂无曲目信息</p>
        <p class="text-xs text-gray-500 mt-0.5">该作品尚未添加任何曲目</p>
      </div>
    </div>
  </section>

  <!-- Modals -->
  <WorkSongLyricsModal
    v-model="showLyricsModal"
    :song-id="activeSong.id"
    :song-title="activeSong.title"
  />
  <WorkSongTranslationsModal
    v-model="showTranslationsModal"
    :song-id="activeSong.id"
    :song-title="activeSong.title"
    :translations-count="activeSong.translationsCount"
  />
</template>

<script setup lang="ts">
import type { WorkSong, WorkDisc, WorkCredit } from '~/types/work'
import { ListMusic, Disc3, Users, Heart, Music2, FileText, Languages } from "lucide-vue-next"

const { isAuthenticated } = useAuth()
const { toggleFavoriteSong } = useFavorites()
const route = useRoute()

const BADGE_PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

const roleBadgeClass = (role: string): string => {
  let hash = 0
  for (let i = 0; i < role.length; i++) {
    hash = (hash * 31 + role.charCodeAt(i)) >>> 0
  }
  return BADGE_PALETTE[hash % BADGE_PALETTE.length]!
}

const showLyricsModal = ref(false)
const showTranslationsModal = ref(false)
const activeSong = ref<{ id: number | null; title: string; translationsCount: number }>({
  id: null,
  title: '',
  translationsCount: 0,
})

const openLyrics = (track: { songId: number | null; title: string }) => {
  activeSong.value = { id: track.songId, title: track.title, translationsCount: 0 }
  showLyricsModal.value = true
}

const openTranslations = (track: { songId: number | null; title: string; translationsCount: number }) => {
  activeSong.value = { id: track.songId, title: track.title, translationsCount: track.translationsCount }
  showTranslationsModal.value = true
}

const CREDITS_STORAGE_KEY = 'cdcat:tracklist:showCredits'
const showCredits = ref(true)

onMounted(() => {
  const saved = localStorage.getItem(CREDITS_STORAGE_KEY)
  if (saved !== null) showCredits.value = saved === 'true'
})

watch(showCredits, (val: boolean) => {
  localStorage.setItem(CREDITS_STORAGE_KEY, String(val))
})

const props = withDefaults(defineProps<{
  songs: WorkSong[]
  structure: WorkDisc[]
}>(), {
  songs: () => [],
  structure: () => [],
})

const favoritedSongs = ref<Record<number, boolean>>(
  Object.fromEntries(props.songs.filter(s => s.is_favorited).map(s => [s.id, true]))
)
const toggleLoading = ref<Record<number, boolean>>({})

const handleToggleFavorite = async (songId: number) => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (toggleLoading.value[songId]) return

  toggleLoading.value = { ...toggleLoading.value, [songId]: true }
  try {
    const result = await toggleFavoriteSong(songId)
    favoritedSongs.value = { ...favoritedSongs.value, [songId]: result.favorited }
  } catch {
    // 401 已由 api 插件处理
  } finally {
    const { [songId]: _, ...rest } = toggleLoading.value
    toggleLoading.value = rest
  }
}

const normalizeNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatDuration = (value: number | null | undefined): string => {
  const seconds = normalizeNumber(value)
  if (seconds === null || seconds < 0) return '--'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

const trackSortValue = (song: WorkSong): number =>
  normalizeNumber(song.track_number) ?? Number.MAX_SAFE_INTEGER

const processTracks = (list: WorkSong[], discNumber: number) => {
  return list
    .slice()
    .sort((a: WorkSong, b: WorkSong) => trackSortValue(a) - trackSortValue(b))
    .map((song: WorkSong) => {
      const trackNumber = normalizeNumber(song.track_number)
      const artistNames = Array.isArray((song as any).artists)
        ? (song as any).artists
            .map((artist: { name?: string }) => artist?.name)
            .filter(Boolean)
            .join(', ')
        : (song as any).artist_names || (song as any).artist || (song as any).artist_name || ''

      // 处理歌曲 Credit
      const credits: WorkCredit[] = (song.credits as WorkCredit[]) || []
      const formattedCredits: { role: string; artists: { name: string; artistId: number | null }[] }[] = []
      if (credits.length > 0) {
        const groups = new Map<string, { name: string; artistId: number | null }[]>()
        credits.forEach((c: WorkCredit) => {
          const role = c.role ? c.role.charAt(0).toUpperCase() + c.role.slice(1) : 'Credit'
          // 优先级：外层 display_name -> artist.name -> pivot.display_name
          const name = c.display_name || c.artist_name || null
          const artistId = c.artist_id || null
          if (name) {
            if (!groups.has(role)) groups.set(role, [])
            const existing = groups.get(role)!.find((item: { name: string }) => item.name === name)
            if (!existing) groups.get(role)!.push({ name, artistId })
          }
        })
        for (const [role, artists] of groups) {
          formattedCredits.push({ role, artists })
        }
      }

      return {
        songId: song.id ?? null,
        uid: song.id ?? `disc-${discNumber}-${trackNumber ?? song.title ?? 'track'}`,
        displayNumber: trackNumber !== null ? trackNumber.toString().padStart(2, '0') : '--',
        title: song.title || 'Untitled Track',
        subtitle: (song.meta as any)?.subtitle || null,
        credits: formattedCredits,
        artist: artistNames,
        duration: formatDuration(song.duration),
        isInstrumental: song.is_instrumental ?? false,
        hasLyrics: song.has_lyrics ?? false,
        translationsCount: song.translations_count ?? 0,
      }
    })
}

interface DiscItem {
  discNumber: number
  title: string | null
  isBonus?: boolean
  isCounted?: boolean
  tracks: ReturnType<typeof processTracks>
}

const discs = computed<DiscItem[]>(() => {
  if (props.structure.length > 0) {
    return props.structure.map((disc: WorkDisc) => {
      const discNumber = disc.disc_number
      const songs = props.songs.filter(
        (s: WorkSong) => (normalizeNumber(s.disc_number) ?? 1) === discNumber
      )
      return {
        discNumber,
        title: disc.title ?? null,
        isBonus: disc.is_bonus ?? false,
        isCounted: disc.is_counted ?? true,
        tracks: processTracks(songs, discNumber),
      }
    })
  }

  if (!props.songs.length) return []

  const discMap = new Map<number, WorkSong[]>()
  props.songs.forEach((song: WorkSong) => {
    const discNumber = normalizeNumber(song.disc_number) ?? 1
    if (!discMap.has(discNumber)) discMap.set(discNumber, [])
    discMap.get(discNumber)!.push(song)
  })

  return Array.from(discMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([discNumber, discSongs]) => ({
      discNumber,
      title: null,
      tracks: processTracks(discSongs, discNumber),
    }))
})
</script>
