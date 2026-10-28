<template>
  <section>
    <div class="card p-5">
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UiButton :icon="ArrowLeft" :label="$t('common.go_back')" size="sm" @click="$emit('back')" />
          <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
            <Music :size="18" class="text-meta" />
            {{ $t('profile.favorite_tracks') }}
          </h2>
          <UiCount v-if="pagination.total" :value="pagination.total" size="sm" />
        </div>
      </div>

      <!-- Loading -->
      <SkeletonRows v-if="loading" :count="6" thumb="square" cards />

      <!-- Error -->
      <div v-else-if="status === 'error' && !response" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-meta">{{ error?.message }}</p>
      </div>

      <!-- Empty -->
      <UiEmpty v-else-if="!tracks.length" :title="$t('profile.no_favorite_tracks')" :icon="Music" />

      <!-- Tracks list -->
      <template v-else>
        <div class="space-y-2 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <component
            :is="track.album ? NuxtLink : 'div'"
            v-for="track in tracks"
            :key="track.id"
            :to="track.album ? `/albums/${track.album.id}` : undefined"
            class="group flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          >
            <!-- Album cover -->
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
              <img
                v-if="hasCover(track)"
                :src="track.album!.image_url!"
                :alt="track.album?.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                @error="onCoverError(track.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-sunken">
                <Music :size="16" class="text-faint" />
              </div>
            </div>

            <!-- Track info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-title group-hover:text-primary transition-colors">
                {{ track.title }}
              </p>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-meta">
                <span v-if="track.album" class="truncate">{{ track.album.title }}</span>
                <span v-if="track.track_number" class="shrink-0">
                  <template v-if="track.disc_number">Disc {{ track.disc_number }} · </template>#{{ track.track_number }}
                </span>
              </div>
            </div>

            <!-- Duration & date -->
            <div class="shrink-0 text-right">
              <p v-if="track.duration" class="tabular-nums text-xs font-medium text-meta">{{ formatDuration(track.duration) }}</p>
              <p class="mt-0.5 inline-flex items-center gap-1 text-[11px] text-meta">
                <Heart :size="11" />
                <span>{{ formatDate(track.favorited_at) }}</span>
              </p>
            </div>

            <ChevronRight :size="14" class="ml-1 text-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </component>
        </div>

        <CommonPagination
          v-model:page="currentPage"
          class="mt-4"
          :total-pages="pagination.last_page"
          :disabled="refetching"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight, Heart, Music } from '@lucide/vue'
import { NuxtLink } from '#components'
import type { ProfileFavoriteTrack, ProfileFavoriteTracksResponse, PaginationInfo } from '~/types/profile'

const props = defineProps<{
  username: string
}>()

defineEmits<{
  back: []
}>()

const { locale } = useI18n()

const currentPage = ref(1)

const { data: response, status, error, loading, refetching } = await usePageAPI<ProfileFavoriteTracksResponse>(
  () => `/v1/profiles/${props.username}/favorites/tracks`,
  { query: () => ({ page: currentPage.value }) },
)

const tracks = computed(() => response.value?.tracks || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 30, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

// --- Cover error handling ---
const failedCoverIds = ref(new Set<number>())

const onCoverError = (trackId: number) => {
  const next = new Set(failedCoverIds.value)
  next.add(trackId)
  failedCoverIds.value = next
}

const hasCover = (track: ProfileFavoriteTrack) => {
  const cover = String(track?.album?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(track.id)
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
