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
            v-for="album in items"
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
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                <span v-if="album.catalog_number">{{ album.catalog_number }}</span>
                <span v-if="album.release_date">{{ formatDate(album.release_date) }}</span>
              </div>
            </div>
            <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NuxtLink>
        </div>

        <CommonPagination
          v-model:page="currentPage"
          class="mt-4"
          :total-pages="pagination.last_page"
          :disabled="pending"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Bookmark, CheckCircle, ChevronRight, Disc3, Headphones, Package, XCircle } from '@lucide/vue'
import type { ProfileTrackingAlbum, ProfileTrackingResponse, PaginationInfo } from '~/types/profile'
import type { TrackingStatus } from '~/types/tracking'

const props = defineProps<{
  username: string
  initialStatus: TrackingStatus
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

const defaultStatusConfig = { status: 'plan_to_listen' as TrackingStatus, label: '', icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60' }

const statusList = computed(() => [
  { status: 'plan_to_listen' as TrackingStatus, label: t('tracking.status.plan_to_listen'), icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60' },
  { status: 'completed' as TrackingStatus, label: t('tracking.status.completed'), icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-600 ring-emerald-200/60' },
  { status: 'wishlist' as TrackingStatus, label: t('tracking.status.wishlist'), icon: Bookmark, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-600 ring-amber-200/60' },
  { status: 'owned' as TrackingStatus, label: t('tracking.status.owned'), icon: Package, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-600 ring-indigo-200/60' },
  { status: 'dropped' as TrackingStatus, label: t('tracking.status.dropped'), icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', badgeClass: 'bg-rose-50 text-rose-600 ring-rose-200/60' },
])

const currentStatusConfig = computed(() =>
  statusList.value.find(s => s.status === status.value) ?? defaultStatusConfig
)

const switchStatus = (newStatus: TrackingStatus) => {
  status.value = newStatus
  currentPage.value = 1
}

const { data: response, pending, error } = await useAPI<ProfileTrackingResponse>(
  () => `/v1/profiles/${props.username}/tracking/albums`,
  {
    query: { status, page: currentPage, per_page: 15 },
    watch: [status, currentPage],
  }
)

const items = computed(() => response.value?.albums || [])

const defaultPagination: PaginationInfo = { total: 0, per_page: 15, current_page: 1, last_page: 1 }
const pagination = computed(() => response.value?.pagination || defaultPagination)

// --- Cover error handling ---
const failedCoverIds = ref(new Set<number>())

const onCoverError = (albumId: number) => {
  const next = new Set(failedCoverIds.value)
  next.add(albumId)
  failedCoverIds.value = next
}

const hasCover = (album: ProfileTrackingAlbum) => {
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
