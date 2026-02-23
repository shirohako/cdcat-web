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
            <component :is="currentStatusConfig.icon" :size="18" class="text-gray-400" />
            {{ currentStatusConfig.label }}
          </h2>
          <span v-if="pagination.total" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1" :class="currentStatusConfig.badgeClass">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="mb-4 flex flex-wrap gap-1.5">
        <button
          v-for="s in statusList"
          :key="s.status"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          :class="s.status === status ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 ring-1 ring-black/5 hover:bg-gray-100 hover:text-gray-700'"
          @click="switchStatus(s.status)"
        >
          <component :is="s.icon" :size="13" />
          {{ s.label }}
        </button>
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
      <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
          <component :is="currentStatusConfig.icon" :size="26" class="text-gray-300" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('tracking.empty_state') }}</p>
      </div>

      <!-- Items list -->
      <template v-else>
        <div class="space-y-2">
          <NuxtLink
            v-for="work in items"
            :key="work.id"
            :to="`/works/${work.id}`"
            class="group flex items-center gap-3 rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
              <img
                v-if="hasCover(work)"
                :src="work.image_url!"
                :alt="work.title"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                @error="onCoverError(work.id)"
              >
              <div v-else class="grid h-full w-full place-items-center bg-linear-to-br from-slate-50 to-slate-100">
                <Disc3 :size="20" class="text-slate-400" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{{ work.title }}</p>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                <span v-if="work.catalog_number">{{ work.catalog_number }}</span>
                <span v-if="work.release_date">{{ formatDate(work.release_date) }}</span>
              </div>
            </div>
            <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div class="mt-6 flex items-center justify-between text-xs text-gray-400">
          <span>{{ pagination.current_page }} / {{ pagination.last_page }}</span>
        </div>
        <div class="mt-2 flex justify-center">
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
                @click="goToPage(page as number)"
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

<script setup lang="ts">
import { ArrowLeft, Bookmark, CheckCircle, ChevronLeft, ChevronRight, Disc3, Headphones, Package, XCircle } from 'lucide-vue-next'
import type { ProfileTrackingWork, ProfileTrackingResponse, PaginationInfo } from '~/types/profile'

const props = defineProps<{
  username: string
  initialStatus: number
}>()

defineEmits<{
  back: []
}>()

const { t, locale } = useI18n()

const status = ref(props.initialStatus)
const currentPage = ref(1)

watch(() => props.initialStatus, (val) => {
  if (val !== status.value) {
    status.value = val
    currentPage.value = 1
  }
})

const defaultStatusConfig = { status: 1, label: '', icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60' }

const statusList = computed(() => [
  { status: 1, label: t('tracking.status.plan_to_listen'), icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60' },
  { status: 2, label: t('tracking.status.completed'), icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-600 ring-emerald-200/60' },
  { status: 3, label: t('tracking.status.wishlist'), icon: Bookmark, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-600 ring-amber-200/60' },
  { status: 4, label: t('tracking.status.owned'), icon: Package, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-600 ring-indigo-200/60' },
  { status: 5, label: t('tracking.status.dropped'), icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', badgeClass: 'bg-rose-50 text-rose-600 ring-rose-200/60' },
])

const currentStatusConfig = computed(() =>
  statusList.value.find(s => s.status === status.value) ?? defaultStatusConfig
)

const switchStatus = (newStatus: number) => {
  status.value = newStatus
  currentPage.value = 1
}

const { data: response, pending, error } = await useAPI<ProfileTrackingResponse>(
  () => `/v1/profiles/${props.username}/tracking`,
  {
    query: { status, page: currentPage, per_page: 15 },
    watch: [status, currentPage],
  }
)

const items = computed(() => response.value?.works || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 15, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

// --- Cover error handling ---
const failedCoverIds = ref(new Set<number>())

const onCoverError = (workId: number) => {
  const next = new Set(failedCoverIds.value)
  next.add(workId)
  failedCoverIds.value = next
}

const hasCover = (work: ProfileTrackingWork) => {
  const cover = String(work?.image_url || '').trim()
  return cover.length > 0 && !failedCoverIds.value.has(work.id)
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

// --- Pagination ---
const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const pages: (number | string)[] = []

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

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
}
</script>
