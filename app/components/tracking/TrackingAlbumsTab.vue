<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State: until there is something to show -->
    <SkeletonRows v-if="isLoading && !albums.length" page :count="5" thumb="square" cards />

    <!-- Empty State -->
    <UiEmpty
      v-else-if="albums.length === 0"
      :title="$t('tracking.empty_state')"
      :description="$t('tracking.empty_hint')"
      icon="lucide:disc-3"
    >
      <template #actions>
        <NuxtLink to="/albums" class="btn btn-primary btn-sm gap-2">
          <Icon name="lucide:search" class="w-4 h-4" />
          {{ $t('common.discover') }}
        </NuxtLink>
      </template>
    </UiEmpty>

    <!-- Albums List -->
    <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :inert="isLoading">
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="album in albums"
          :key="album.id"
          class="rounded-xl bg-sunken p-4"
        >
          <div class="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/albums/${album.albumId}`"
              class="shrink-0"
              :aria-label="album.albumTitle"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-sunken ring-1 ring-line">
                <img
                  v-if="album.image_url"
                  :src="album.image_url"
                  :alt="album.albumTitle"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-faint">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <NuxtLink
                :to="`/albums/${album.albumId}`"
                class="block font-semibold text-sm sm:text-base text-title hover:text-primary transition-colors duration-150 ease-out line-clamp-2"
              >
                {{ album.albumTitle }}
              </NuxtLink>

              <p v-if="album.byline" class="text-xs sm:text-sm text-body mt-1 line-clamp-1">
                {{ bylineText(album.byline, 1) }}
              </p>

              <div class="mt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-meta">
                <span v-if="album.release_date">{{ formatDate(album.release_date) }}</span>
                <span>{{ album.catalog_number }}</span>
                <span v-if="album.type !== 'album'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-btn text-btn-content uppercase">{{ album.type }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-center sm:justify-end gap-1.5">
              <!-- Status Dropdown -->
              <div class="dropdown dropdown-end">
                <button
                  tabindex="0"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ease-out"
                  :class="statusBadgeClass(album.status)"
                >
                  <Icon :name="statusIcon(album.status)" class="w-3.5 h-3.5" />
                  {{ getStatusLabel(album.status) }}
                  <Icon name="lucide:chevron-down" class="w-3 h-3 opacity-60" />
                </button>
                <ul
                  tabindex="0"
                  class="dropdown-content z-1 menu w-44 rounded-xl bg-popover p-1.5 shadow-overlay ring-1 ring-line"
                >
                  <li v-for="s in otherStatuses(album.status)" :key="s">
                    <a
                      class="flex items-center gap-2 text-sm rounded-lg"
                      @click="handleStatusChange(album.id, s)"
                    >
                      <Icon :name="statusIcon(s)" class="w-4 h-4" :class="statusTextColor(s)" />
                      {{ getStatusLabel(s) }}
                    </a>
                  </li>
                </ul>
              </div>

              <!-- View -->
              <NuxtLink
                :to="`/albums/${album.albumId}`"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary flex-none"
                :aria-label="album.albumTitle"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5" />
              </NuxtLink>

              <!-- Remove -->
              <button
                type="button"
                :disabled="removingId === album.id"
                @click="handleRemove(album.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-meta transition-colors duration-150 ease-out hover:bg-danger/10 hover:text-danger flex-none disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t('tracking.remove')"
              >
                <Icon
                  v-if="removingId !== album.id"
                  name="lucide:trash-2"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                />
                <Icon
                  v-else
                  name="lucide:loader"
                  class="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommonPagination
        v-model:page="currentPage"
        :total-pages="totalPages"
        :disabled="isLoading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingStatus, TrackingAlbum } from '~/types/tracking'
import { bylineText } from '~/utils/albumByline'

interface Props {
  status: TrackingStatus
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:stats': [void]
}>()

const { getTrackingAlbums, setAlbumTracking, deleteAlbumTracking } = useTracking()
const { t } = useI18n()

const albums = ref<TrackingAlbum[]>([])
// True from the start, so the empty state doesn't show before the first load.
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const removingId = ref<number | null>(null)

const allStatuses: TrackingStatus[] = ['plan_to_listen', 'completed', 'wishlist', 'owned', 'dropped']

const otherStatuses = (currentStatus: TrackingStatus): TrackingStatus[] => {
  return allStatuses.filter(s => s !== currentStatus)
}

const getStatusLabel = (status: TrackingStatus): string => {
  const labels: Record<TrackingStatus, string> = {
    plan_to_listen: t('tracking.status.plan_to_listen'),
    wishlist: t('tracking.status.wishlist'),
    completed: t('tracking.status.completed'),
    owned: t('tracking.status.owned'),
    dropped: t('tracking.status.dropped')
  }
  return labels[status]
}

const statusIcon = (status: TrackingStatus): string => {
  const icons: Record<TrackingStatus, string> = {
    plan_to_listen: 'lucide:headphones',
    wishlist: 'lucide:bookmark',
    completed: 'lucide:check-circle',
    owned: 'lucide:package',
    dropped: 'lucide:x-circle'
  }
  return icons[status]
}

// Each status keeps its own colour (they must stay apart), with a partner for the dark theme; "dropped" is neutral.
const statusBadgeClass = (status: TrackingStatus): string => {
  const classes: Record<TrackingStatus, string> = {
    plan_to_listen: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-400/15 dark:text-purple-300 dark:hover:bg-purple-400/25',
    wishlist: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25',
    completed: 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-400/15 dark:text-teal-300 dark:hover:bg-teal-400/25',
    owned: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25',
    dropped: 'bg-btn text-btn-content hover:bg-btn-hover'
  }
  return classes[status]
}

const statusTextColor = (status: TrackingStatus): string => {
  const colors: Record<TrackingStatus, string> = {
    plan_to_listen: 'text-purple-500 dark:text-purple-400',
    wishlist: 'text-blue-500 dark:text-blue-400',
    completed: 'text-teal-500 dark:text-teal-400',
    owned: 'text-emerald-500 dark:text-emerald-400',
    dropped: 'text-meta'
  }
  return colors[status]
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const loadAlbums = async () => {
  isLoading.value = true
  try {
    const response = await getTrackingAlbums(props.status, currentPage.value, pageSize.value)
    albums.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to load tracking albums:', error)
  } finally {
    isLoading.value = false
  }
}

const handleStatusChange = async (trackingId: number, newStatus: TrackingStatus) => {
  const album = albums.value.find(w => w.id === trackingId)
  if (!album) return

  try {
    await setAlbumTracking(album.albumId, newStatus)
    await loadAlbums()
    emit('update:stats')
  } catch (error) {
    console.error('Failed to change tracking status:', error)
  }
}

const handleRemove = async (trackingId: number) => {
  const album = albums.value.find(w => w.id === trackingId)
  if (!album) return

  removingId.value = trackingId
  try {
    await deleteAlbumTracking(album.albumId)
    await loadAlbums()
    emit('update:stats')
  } catch (error) {
    console.error('Failed to remove tracking:', error)
  } finally {
    removingId.value = null
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

watch(currentPage, () => {
  loadAlbums()
})

watch(
  () => props.status,
  () => {
    currentPage.value = 1
    loadAlbums()
  }
)

// First load: at once on client-side navigation, after hydration on a server-rendered page. Then again each
// time KeepAlive shows this tab again; its first activation is the mount itself.
if (import.meta.client && !useNuxtApp().isHydrating) loadAlbums()
else onMounted(loadAlbums)
let activated = false
onActivated(() => {
  if (activated) loadAlbums()
  activated = true
})
</script>
