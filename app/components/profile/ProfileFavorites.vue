<template>
  <section class="animate-fade-in-up-slow">
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-base font-semibold leading-6 text-gray-900">
          <Disc3 :size="18" class="text-gray-400" />
          {{ $t('profile.favorites') }}
        </h2>
        <span class="text-xs text-gray-400">{{ totalCount }} {{ $t('profile.total') }}</span>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink
          v-for="work in works"
          :key="work.id"
          :to="`/works/${work.workId}`"
          class="group overflow-hidden rounded-xl bg-white/90 ring-1 ring-black/5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="relative aspect-square overflow-hidden bg-gray-100">
            <img
              v-if="hasCover(work)"
              :src="work.cover"
              :alt="work.workTitle"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              @error="onCoverError(work.id)"
            >
            <div v-else class="grid h-full w-full place-items-center bg-linear-to-br from-slate-50 to-slate-100">
              <Disc3 :size="34" class="text-slate-500" />
            </div>
          </div>

          <div class="px-2.5 pb-2.5 pt-2">
            <p class="truncate text-xs font-semibold leading-4 text-gray-900">
              {{ work.workTitle }}
            </p>
            <p class="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
              <Calendar :size="12" />
              <span>{{ formatCollectedAt(work.releaseDate) }}</span>
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Calendar, Disc3 } from 'lucide-vue-next'
const { locale } = useI18n()
const failedCoverIds = ref(new Set())

defineProps({
  works: {
    type: Array,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  }
})

const formatterLocale = computed(() => {
  const map = {
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
    en: 'en-US',
    ja: 'ja-JP'
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

const onCoverError = (workId) => {
  const next = new Set(failedCoverIds.value)
  next.add(workId)
  failedCoverIds.value = next
}

const hasCover = (work) => {
  const cover = String(work?.cover || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(work.id)
}
</script>
