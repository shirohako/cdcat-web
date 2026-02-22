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
      <div v-if="pending" class="flex min-h-[30vh] items-center justify-center">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-gray-400">{{ error.message }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!works.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <Disc3 :size="26" class="text-amber-400" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('profile.no_favorite_works') }}</p>
      </div>

      <!-- Works grid -->
      <template v-else>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          <NuxtLink
            v-for="work in works"
            :key="work.id"
            :to="`/works/${work.id}`"
            class="group overflow-hidden rounded-xl bg-white/90 ring-1 ring-black/5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="relative aspect-square overflow-hidden bg-gray-100">
              <img
                v-if="hasCover(work)"
                :src="work.image_url"
                :alt="work.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                @error="onCoverError(work.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-linear-to-br from-slate-50 to-slate-100">
                <Disc3 :size="34" class="text-slate-500" />
              </div>
            </div>
            <div class="px-2.5 pb-2.5 pt-2">
              <p class="truncate text-xs font-semibold leading-4 text-gray-900">{{ work.title }}</p>
              <p class="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Heart :size="12" />
                <span>{{ formatDate(work.favorited_at) }}</span>
              </p>
            </div>
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
import { ArrowLeft, ChevronLeft, ChevronRight, Disc3, Heart } from 'lucide-vue-next'

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
  () => `/v1/profiles/${props.username}/favorites/works`,
  {
    query: { page: currentPage },
    watch: [currentPage],
  }
)

const works = computed(() => response.value?.works || [])

const pagination = computed(() => response.value?.pagination || {
  total: 0, per_page: 30, current_page: 1, last_page: 1,
})

// --- Cover error handling ---
const failedCoverIds = ref(new Set())

const onCoverError = (workId) => {
  const next = new Set(failedCoverIds.value)
  next.add(workId)
  failedCoverIds.value = next
}

const hasCover = (work) => {
  const cover = String(work?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(work.id)
}

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
