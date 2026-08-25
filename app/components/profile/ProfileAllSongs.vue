<template>
  <section>
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" @click="$emit('back')">
            <ArrowLeft :size="16" />
          </button>
          <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-gray-900">
            <Music :size="18" class="text-gray-400" />
            {{ $t('profile.favorite_songs') }}
          </h2>
          <span v-if="pagination.total" class="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200/60">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex min-h-[30vh] items-center justify-center">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-gray-400">{{ error.message }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!songs.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <Music :size="26" class="text-rose-400" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('profile.no_favorite_songs') }}</p>
      </div>

      <!-- Songs list -->
      <template v-else>
        <div class="space-y-2">
          <NuxtLink
            v-for="song in songs"
            :key="song.id"
            :to="song.work ? `/works/${song.work.id}` : '#'"
            class="group flex items-center gap-3 rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
          >
            <!-- Work cover -->
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
              <img
                v-if="hasCover(song)"
                :src="song.work!.image_url!"
                :alt="song.work?.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                @error="onCoverError(song.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-linear-to-br from-rose-50 to-pink-100">
                <Music :size="16" class="text-rose-400" />
              </div>
            </div>

            <!-- Song info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                {{ song.title }}
              </p>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                <span v-if="song.work" class="truncate">{{ song.work.title }}</span>
                <span v-if="song.track_number" class="shrink-0">
                  <template v-if="song.disc_number">Disc {{ song.disc_number }} · </template>#{{ song.track_number }}
                </span>
              </div>
            </div>

            <!-- Duration & date -->
            <div class="shrink-0 text-right">
              <p v-if="song.duration" class="tabular-nums text-xs font-medium text-gray-500">{{ formatDuration(song.duration) }}</p>
              <p class="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-400">
                <Heart :size="11" />
                <span>{{ formatDate(song.favorited_at) }}</span>
              </p>
            </div>

            <ChevronRight :size="14" class="ml-1 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NuxtLink>
        </div>

        <CommonPagination
          v-model:page="currentPage"
          class="mt-6"
          :total-pages="pagination.last_page"
          :disabled="pending"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight, Heart, Music } from '@lucide/vue'
import type { ProfileFavoriteSong, ProfileFavoriteSongsResponse, PaginationInfo } from '~/types/profile'

const props = defineProps<{
  username: string
}>()

defineEmits<{
  back: []
}>()

const { locale } = useI18n()

const currentPage = ref(1)

const { data: response, pending, error } = await useAPI<ProfileFavoriteSongsResponse>(
  () => `/v1/profiles/${props.username}/favorites/songs`,
  {
    query: { page: currentPage },
    watch: [currentPage],
  }
)

const songs = computed(() => response.value?.songs || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 30, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

// --- Cover error handling ---
const failedCoverIds = ref(new Set<number>())

const onCoverError = (songId: number) => {
  const next = new Set(failedCoverIds.value)
  next.add(songId)
  failedCoverIds.value = next
}

const hasCover = (song: ProfileFavoriteSong) => {
  const cover = String(song?.work?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(song.id)
}

// --- Formatting ---
const formatterLocale = computed(() => {
  const map: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', en: 'en-US', ja: 'ja-JP' }
  return map[locale.value] || 'zh-CN'
})

const formatDate = (dateValue: string) => {
  const text = String(dateValue || '').trim()
  if (!text) return '--'
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString(formatterLocale.value, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>
