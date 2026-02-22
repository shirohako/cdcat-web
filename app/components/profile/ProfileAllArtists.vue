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
            <Mic2 :size="18" class="text-gray-400" />
            {{ $t('profile.top_artists') }}
          </h2>
          <span v-if="pagination.total" class="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 ring-1 ring-violet-200/60">
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
      <div v-else-if="!artists.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
          <Mic2 :size="26" class="text-violet-400" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('profile.no_favorite_artists') }}</p>
      </div>

      <!-- Artists list -->
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <NuxtLink
            v-for="artist in artists"
            :key="artist.id"
            :to="`/artists/${artist.id}`"
            class="group flex items-center gap-3 rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-purple-200 to-blue-200 ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110">
              <img v-if="artist.image_url" :src="artist.image_url" :alt="artist.name" class="w-full h-full object-cover">
              <div v-else class="w-full h-full flex items-center justify-center text-white/60">
                <Mic2 :size="16" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">
                {{ artist.name }}
              </span>
              <span v-if="artist.favorited_at" class="text-[11px] text-gray-400">{{ formatDate(artist.favorited_at) }}</span>
            </div>
            <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="mt-6 flex justify-center">
          <div class="flex items-center gap-1">
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >
              <ChevronLeft :size="16" />
            </button>
            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors"
                :class="page === pagination.current_page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <span v-else class="inline-flex h-8 w-8 items-center justify-center text-sm text-gray-400">...</span>
            </template>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ArrowLeft, ChevronLeft, ChevronRight, Mic2 } from 'lucide-vue-next'

const props = defineProps({
  username: {
    type: String,
    required: true
  }
})

defineEmits(['back'])

const { locale } = useI18n()

const currentPage = ref(1)

const { data: response, pending, error } = await useAPI(
  () => `/v1/profiles/${props.username}/favorites/artists`,
  {
    query: { page: currentPage },
    watch: [currentPage],
  }
)

const artists = computed(() => response.value?.artists || [])

const pagination = computed(() => response.value?.pagination || {
  total: 0, per_page: 30, current_page: 1, last_page: 1,
})

// --- Date formatting ---
const formatterLocale = computed(() => {
  const map = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', en: 'en-US', ja: 'ja-JP' }
  return map[locale.value] || 'zh-CN'
})

const formatDate = (dateValue) => {
  const text = String(dateValue || '').trim()
  if (!text) return '--'
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString(formatterLocale.value, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// --- Pagination ---
const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const pages = []

  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(last - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < last - 2) pages.push('...')
    pages.push(last)
  }
  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
}
</script>
