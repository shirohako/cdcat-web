<template>
  <section>
    <div class="card p-5">
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UiButton :icon="ArrowLeft" :label="$t('common.go_back')" size="sm" @click="$emit('back')" />
          <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
            <Disc3 :size="18" class="text-meta" />
            {{ $t('profile.favorites') }}
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
      <UiEmpty v-else-if="!albums.length" :title="$t('profile.no_favorite_albums')" :icon="Disc3" />

      <!-- Albums list -->
      <template v-else>
        <div class="space-y-2 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <NuxtLink
            v-for="album in albums"
            :key="album.id"
            :to="`/albums/${album.id}`"
            class="group flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
              <img
                v-if="hasCover(album)"
                :src="album.image_url!"
                :alt="album.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                @error="onCoverError(album.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-sunken">
                <Disc3 :size="20" class="text-faint" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-title group-hover:text-primary transition-colors">{{ album.title }}</p>
              <p class="mt-0.5 inline-flex items-center gap-1 text-[11px] text-meta">
                <Heart :size="11" />
                <span>{{ formatDate(album.favorited_at) }}</span>
              </p>
            </div>
            <ChevronRight :size="14" class="ml-auto text-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
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
  const map: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' }
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
