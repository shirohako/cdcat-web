<template>
  <section>
    <div class="card p-5">
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-meta hover:bg-ghost-hover hover:text-primary transition-colors duration-150 ease-out cursor-pointer" @click="$emit('back')">
            <ArrowLeft :size="16" />
          </button>
          <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
            <Mic2 :size="18" class="text-meta" />
            {{ $t('profile.top_artists') }}
          </h2>
          <UiCount v-if="pagination.total" :value="pagination.total" size="sm" />
        </div>
      </div>

      <!-- Loading -->
      <SkeletonRows v-if="loading" :count="6" thumb="round" cards />

      <!-- Error -->
      <div v-else-if="status === 'error' && !response" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-meta">{{ error?.message }}</p>
      </div>

      <!-- Empty -->
      <UiEmpty v-else-if="!artists.length" :title="$t('profile.no_favorite_artists')" :icon="Mic2" />

      <!-- Artists list -->
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <NuxtLink
            v-for="artist in artists"
            :key="artist.id"
            :to="`/artists/${artist.id}`"
            class="group flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sunken ring-1 ring-line transition-transform duration-300 group-hover:scale-110">
              <img v-if="artist.image_url" :src="artist.image_url" :alt="artist.name" class="w-full h-full object-cover">
              <div v-else class="w-full h-full flex items-center justify-center text-faint">
                <Mic2 :size="16" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-body group-hover:text-primary transition-colors truncate">
                {{ artist.name }}
              </span>
              <span v-if="artist.favorited_at" class="text-[11px] text-meta">{{ formatDate(artist.favorited_at) }}</span>
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
import { ArrowLeft, ChevronRight, Mic2 } from '@lucide/vue'
import type { ProfileFavoriteArtistsResponse, PaginationInfo } from '~/types/profile'

const props = defineProps<{
  username: string
}>()

defineEmits<{
  back: []
}>()

const { locale } = useI18n()

const currentPage = ref(1)

const { data: response, status, error, loading, refetching } = await usePageAPI<ProfileFavoriteArtistsResponse>(
  () => `/v1/profiles/${props.username}/favorites/artists`,
  { query: () => ({ page: currentPage.value }) },
)

const artists = computed(() => response.value?.artists || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 30, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

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
