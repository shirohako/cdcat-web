<template>
  <NuxtLink :to="`/works/${work.id}`" class="group">
    <div class="transform overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
        <img
          v-if="work.image_url"
          :src="work.image_url"
          :alt="work.title"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          style="image-rendering: -webkit-optimize-contrast;"
        >
        <div v-else class="text-gray-300">
          <Disc3 :size="64" />
        </div>
        <div class="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div v-if="work.type" class="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {{ formatType(work.type) }}
        </div>
        <div class="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <Disc3 :size="11" />
          {{ work.disc_count || 0 }}
        </div>
        <div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <Music :size="11" />
          {{ work.track_count || 0 }}
        </div>
      </div>

      <div class="flex flex-col gap-2 bg-white p-4">
        <h3 class="flex h-5 min-w-0 items-center text-sm font-bold transition-colors group-hover:text-blue-600">
          <span class="truncate">{{ work.title }}</span>
        </h3>

        <div class="flex h-4 min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <template v-if="work.catalog_number">
            <Hash :size="14" class="shrink-0 text-gray-400" />
            <span class="truncate">{{ work.catalog_number }}</span>
          </template>
          <template v-else>
            <Hash :size="14" class="shrink-0 text-gray-300" />
            <span class="text-gray-300">—</span>
          </template>
        </div>

        <div class="flex h-4 min-w-0 items-center gap-1.5 text-xs text-gray-600">
          <template v-if="work.release_date">
            <Calendar :size="14" class="shrink-0 text-gray-400" />
            <span>{{ formatDate(work.release_date) }}</span>
          </template>
          <template v-else>
            <Calendar :size="14" class="shrink-0 text-gray-300" />
            <span class="text-gray-300">—</span>
          </template>
        </div>

        <div class="grid h-6 grid-cols-2 items-end border-t border-gray-100 text-xs text-gray-600">
          <div class="flex items-center gap-1.5">
            <Eye :size="14" class="shrink-0 text-gray-400" />
            <span>{{ work.views_count || 0 }}</span>
          </div>
          <div class="flex items-center justify-self-end gap-1.5">
            <Heart
              :size="14"
              :fill="work.is_favorited ? 'currentColor' : 'none'"
              :class="work.is_favorited ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'"
              class="shrink-0 transition-colors"
            />
            <span>{{ work.likes_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { Calendar, Disc3, Eye, Hash, Heart, Music } from '@lucide/vue'

defineProps({
  work: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const formatType = type => ({
  album: t('works.type.album'),
  single: t('works.type.single'),
  ep: t('works.type.ep'),
  compilation: t('works.type.compilation'),
  drama: t('works.type.drama'),
  radio: t('works.type.radio'),
})[type] || type

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>
