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
            <Disc3 :size="18" class="text-gray-400" />
            {{ $t('profile.favorites') }}
          </h2>
          <span v-if="pagination.total" class="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600 ring-1 ring-sky-200/60">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <SkeletonRows v-if="loading" :count="6" thumb="square" cards />

      <!-- Error -->
      <div v-else-if="status === 'error' && !response" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-gray-400">{{ error?.message }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!albums.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <Disc3 :size="26" class="text-amber-400" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('profile.no_favorite_albums') }}</p>
      </div>

      <!-- Albums list -->
      <template v-else>
        <div class="space-y-2 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <NuxtLink
            v-for="album in albums"
            :key="album.id"
            :to="`/albums/${album.id}`"
            class="group flex items-center gap-3 rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
              <img
                v-if="hasCover(album)"
                :src="album.image_url!"
                :alt="album.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                @error="onCoverError(album.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-linear-to-br from-slate-50 to-slate-100">
                <Disc3 :size="20" class="text-slate-400" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{{ album.title }}</p>
              <p class="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-400">
                <Heart :size="11" />
                <span>{{ formatDate(album.favorited_at) }}</span>
              </p>
            </div>
            <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NuxtLink>
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
import { ArrowLeft, ChevronRight, Disc3, Heart } from '@lucide/vue'
import type { ProfileFavoriteAlbum, ProfileFavoriteAlbumsResponse, PaginationInfo } from '~/types/profile'

const props = defineProps<{
  username: string
}>()

defineEmits<{
  back: []
}>()

const { locale } = useI18n()

const currentPage = ref(1)

const { data: response, status, error, loading, refetching } = await usePageAPI<ProfileFavoriteAlbumsResponse>(
  () => `/v1/profiles/${props.username}/favorites/albums`,
  { query: () => ({ page: currentPage.value }) },
)

const albums = computed(() => response.value?.albums || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 30, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

// --- Cover error handling ---
const failedCoverIds = ref(new Set<number>())

const onCoverError = (albumId: number) => {
  const next = new Set(failedCoverIds.value)
  next.add(albumId)
  failedCoverIds.value = next
}

const hasCover = (album: ProfileFavoriteAlbum) => {
  const cover = String(album?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(album.id)
}

// --- Date formatting ---
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
</script>
