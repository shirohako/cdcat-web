<template>
  <section>
    <div class="card p-5">
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UiButton :icon="ArrowLeft" :label="$t('common.go_back')" size="sm" @click="$emit('back')" />
          <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
            <component :is="currentStatusConfig.icon" :size="18" class="text-meta" />
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
          class="chip chip-sm cursor-pointer"
          :class="{ 'chip-selected': s.status === status }"
          @click="switchStatus(s.status)"
        >
          <component :is="s.icon" :size="13" />
          {{ s.label }}
        </button>
      </div>

      <!-- Loading -->
      <SkeletonRows v-if="loading" :count="6" thumb="square" cards />

      <!-- Error -->
      <div v-else-if="loadStatus === 'error' && !response" class="flex min-h-[20vh] items-center justify-center">
        <p class="text-sm text-meta">{{ error?.message }}</p>
      </div>

      <!-- Empty -->
      <UiEmpty v-else-if="!items.length" :title="$t('tracking.empty_state')" :icon="currentStatusConfig.icon" />

      <!-- Items list -->
      <template v-else>
        <div class="space-y-2 transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <NuxtLink
            v-for="album in items"
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
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-meta">
                <span v-if="album.catalog_number">{{ album.catalog_number }}</span>
                <span v-if="album.release_date">{{ formatDate(album.release_date) }}</span>
              </div>
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

const defaultStatusConfig = { status: 'plan_to_listen' as TrackingStatus, label: '', icon: Headphones, iconBg: 'bg-sky-50 dark:bg-sky-400/15', iconColor: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/25' }

const statusList = computed(() => [
  { status: 'plan_to_listen' as TrackingStatus, label: t('tracking.status.plan_to_listen'), icon: Headphones, iconBg: 'bg-sky-50 dark:bg-sky-400/15', iconColor: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-50 text-sky-600 ring-sky-200/60 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/25' },
  { status: 'completed' as TrackingStatus, label: t('tracking.status.completed'), icon: CheckCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-400/15', iconColor: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-600 ring-emerald-200/60 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  { status: 'wishlist' as TrackingStatus, label: t('tracking.status.wishlist'), icon: Bookmark, iconBg: 'bg-amber-50 dark:bg-amber-400/15', iconColor: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 text-amber-600 ring-amber-200/60 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25' },
  { status: 'owned' as TrackingStatus, label: t('tracking.status.owned'), icon: Package, iconBg: 'bg-indigo-50 dark:bg-indigo-400/15', iconColor: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-50 text-indigo-600 ring-indigo-200/60 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/25' },
  { status: 'dropped' as TrackingStatus, label: t('tracking.status.dropped'), icon: XCircle, iconBg: 'bg-rose-50 dark:bg-rose-400/15', iconColor: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-50 text-rose-600 ring-rose-200/60 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/25' },
])

const currentStatusConfig = computed(() =>
  statusList.value.find(s => s.status === status.value) ?? defaultStatusConfig
)

const switchStatus = (newStatus: TrackingStatus) => {
  status.value = newStatus
  currentPage.value = 1
}

const { data: response, status: loadStatus, error, loading, refetching } = await usePageAPI<ProfileTrackingResponse>(
  () => `/v1/profiles/${props.username}/tracking/albums`,
  { query: () => ({ status: status.value, page: currentPage.value, per_page: 15 }) },
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
