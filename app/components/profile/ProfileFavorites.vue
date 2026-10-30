<template>
  <section class="animate-fade-in-up-slow">
    <div class="card p-5">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
          <Disc3 :size="18" class="text-meta" />
          {{ $t('profile.favorites') }}
          <UiCount v-if="totalCount" :value="totalCount" size="sm" />
        </h2>
        <UiButton v-if="albums.length" size="xs" :icon-right="ChevronRight" @click="$emit('view-all')">
          {{ $t('common.view_all') }}
        </UiButton>
      </div>

      <!-- Empty state -->
      <UiEmpty v-if="!albums.length" :title="$t('profile.no_favorite_albums')" :icon="Disc3" />

      <!-- Albums grid -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink
          v-for="album in albums"
          :key="album.id"
          :to="`/albums/${album.id}`"
          class="group overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
        >
          <div class="relative aspect-square overflow-hidden bg-sunken">
            <img
              v-if="hasCover(album)"
              :src="album.image_url"
              :alt="album.title"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              @error="onCoverError(album.id)"
            >
            <div v-else class="grid h-full w-full place-items-center bg-sunken">
              <Disc3 :size="34" class="text-faint" />
            </div>
          </div>

          <div class="px-2.5 pb-2.5 pt-2">
            <p class="truncate text-xs font-semibold leading-4 text-title transition-colors group-hover:text-primary">
              {{ album.title }}
            </p>
            <p class="mt-1 inline-flex items-center gap-1 text-[11px] text-meta">
              <Heart :size="12" />
              <span>{{ formatCollectedAt(album.favorited_at) }}</span>
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ChevronRight, Disc3, Heart } from '@lucide/vue'
const { locale } = useI18n()
const failedCoverIds = ref(new Set())

defineProps({
  albums: {
    type: Array,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  }
})

defineEmits(['view-all'])

const formatterLocale = computed(() => {
  const map = {
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR'
  }
  return map[locale.value] || 'zh-CN'
})

const formatCollectedAt = (dateValue) => {
  const text = String(dateValue || '').trim()
  if (!text) return '--'

  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString(formatterLocale.value, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const onCoverError = (albumId) => {
  const next = new Set(failedCoverIds.value)
  next.add(albumId)
  failedCoverIds.value = next
}

const hasCover = (album) => {
  const cover = String(album?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(album.id)
}
</script>
