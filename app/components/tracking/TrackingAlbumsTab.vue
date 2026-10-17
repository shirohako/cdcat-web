<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="albums.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:disc-3" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('tracking.empty_state') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('tracking.empty_hint') }}</p>
      <NuxtLink to="/albums" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('common.discover') }}
      </NuxtLink>
    </div>

    <!-- Albums List -->
    <div v-else>
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="album in albums"
          :key="album.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/albums/${album.albumId}`"
              class="shrink-0"
              :aria-label="album.albumTitle"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="album.image_url"
                  :src="album.image_url"
                  :alt="album.albumTitle"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <NuxtLink
                :to="`/albums/${album.albumId}`"
                class="block font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
              >
                {{ album.albumTitle }}
              </NuxtLink>

              <p class="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                {{ album.artists.map(a => a.name).join(', ') }}
              </p>

              <div class="mt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400">
                <span v-if="album.release_date">{{ formatDate(album.release_date) }}</span>
                <span>{{ album.catalog_number }}</span>
                <span v-if="album.type !== 'album'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase">{{ album.type }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-center sm:justify-end gap-1.5">
              <!-- Status Dropdown -->
              <div class="dropdown dropdown-end">
                <button
                  tabindex="0"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  :class="statusBadgeClass(album.status)"
                >
                  <Icon :name="statusIcon(album.status)" class="w-3.5 h-3.5" />
                  {{ getStatusLabel(album.status) }}
                  <Icon name="lucide:chevron-down" class="w-3 h-3 opacity-60" />
                </button>
                <ul
                  tabindex="0"
                  class="dropdown-content z-1 menu p-1.5 shadow-lg bg-base-100 rounded-xl w-44 ring-1 ring-black/5"
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
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="album.albumTitle"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </NuxtLink>

              <!-- Remove -->
              <button
                type="button"
                :disabled="removingId === album.id"
                @click="handleRemove(album.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-red-50 flex-none disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t('tracking.remove')"
              >
                <Icon
                  v-if="removingId !== album.id"
                  name="lucide:trash-2"
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-red-500 transition-colors"
                />
                <Icon
                  v-else
                  name="lucide:loader"
                  class="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400"
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
const isLoading = ref(false)
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

const statusBadgeClass = (status: TrackingStatus): string => {
  const classes: Record<TrackingStatus, string> = {
    plan_to_listen: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    wishlist: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    completed: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
    owned: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    dropped: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
  }
  return classes[status]
}

const statusTextColor = (status: TrackingStatus): string => {
  const colors: Record<TrackingStatus, string> = {
    plan_to_listen: 'text-purple-500',
    wishlist: 'text-blue-500',
    completed: 'text-teal-500',
    owned: 'text-emerald-500',
    dropped: 'text-gray-400'
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

onMounted(() => {
  loadAlbums()
})

onActivated(() => {
  loadAlbums()
})
</script>
