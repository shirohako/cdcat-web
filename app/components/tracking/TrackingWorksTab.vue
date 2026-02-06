<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="works.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:disc-3" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('tracking.empty_state') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('tracking.empty_hint') }}</p>
      <NuxtLink to="/works" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('common.discover') }}
      </NuxtLink>
    </div>

    <!-- Works List -->
    <div v-else>
      <div class="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <div
          v-for="work in works"
          :key="work.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/works/${work.workId}`"
              class="shrink-0"
              :aria-label="work.workTitle"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="work.image_url"
                  :src="work.image_url"
                  :alt="work.workTitle"
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
                :to="`/works/${work.workId}`"
                class="block font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
              >
                {{ work.workTitle }}
              </NuxtLink>

              <p class="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                {{ work.artists.map(a => a.name).join(', ') }}
              </p>

              <div class="mt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400">
                <span v-if="work.release_date">{{ formatDate(work.release_date) }}</span>
                <span>{{ work.catalog_number }}</span>
                <span v-if="work.type !== 'album'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase">{{ work.type }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-center sm:justify-end gap-1.5">
              <!-- Status Dropdown -->
              <div class="dropdown dropdown-end">
                <button
                  tabindex="0"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  :class="statusBadgeClass(work.status)"
                >
                  <Icon :name="statusIcon(work.status)" class="w-3.5 h-3.5" />
                  {{ getStatusLabel(work.status) }}
                  <Icon name="lucide:chevron-down" class="w-3 h-3 opacity-60" />
                </button>
                <ul
                  tabindex="0"
                  class="dropdown-content z-1 menu p-1.5 shadow-lg bg-base-100 rounded-xl w-44 ring-1 ring-black/5"
                >
                  <li v-for="s in otherStatuses(work.status)" :key="s">
                    <a
                      class="flex items-center gap-2 text-sm rounded-lg"
                      @click="handleStatusChange(work.id, s)"
                    >
                      <Icon :name="statusIcon(s)" class="w-4 h-4" :class="statusTextColor(s)" />
                      {{ getStatusLabel(s) }}
                    </a>
                  </li>
                </ul>
              </div>

              <!-- View -->
              <NuxtLink
                :to="`/works/${work.workId}`"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="work.workTitle"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </NuxtLink>

              <!-- Remove -->
              <button
                type="button"
                :disabled="removingId === work.id"
                @click="handleRemove(work.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-red-50 flex-none disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t('tracking.remove')"
              >
                <Icon
                  v-if="removingId !== work.id"
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

      <!-- Pagination -->
      <div v-if="total > 0" class="flex items-center justify-center gap-2">
        <button
          :disabled="currentPage === 1"
          @click="previousPage"
          class="btn btn-outline btn-sm gap-1"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
          {{ $t('common.previous') }}
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            @click="goToPage(pageNum)"
            :class="[
              'btn btn-sm',
              currentPage === pageNum ? 'btn-primary' : 'btn-outline'
            ]"
          >
            {{ pageNum }}
          </button>
        </div>

        <button
          :disabled="currentPage === totalPages"
          @click="nextPage"
          class="btn btn-outline btn-sm gap-1"
        >
          {{ $t('common.next') }}
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingStatus, TrackingWork } from '~/types/tracking'

interface Props {
  status: TrackingStatus
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:stats': [void]
}>()

const { getTrackingWorks, setWorkTracking, deleteWorkTracking } = useTracking()
const { t } = useI18n()

const works = ref<TrackingWork[]>([])
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

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, currentPage.value - half)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const loadWorks = async () => {
  isLoading.value = true
  try {
    const response = await getTrackingWorks(props.status, currentPage.value, pageSize.value)
    works.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to load tracking works:', error)
  } finally {
    isLoading.value = false
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
}

const handleStatusChange = async (trackingId: number, newStatus: TrackingStatus) => {
  const work = works.value.find(w => w.id === trackingId)
  if (!work) return

  try {
    await setWorkTracking(work.workId, newStatus)
    await loadWorks()
    emit('update:stats')
  } catch (error) {
    console.error('Failed to change tracking status:', error)
  }
}

const handleRemove = async (trackingId: number) => {
  const work = works.value.find(w => w.id === trackingId)
  if (!work) return

  removingId.value = trackingId
  try {
    await deleteWorkTracking(work.workId)
    await loadWorks()
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
  loadWorks()
})

watch(
  () => props.status,
  () => {
    currentPage.value = 1
    loadWorks()
  }
)

onMounted(() => {
  loadWorks()
})

onActivated(() => {
  loadWorks()
})
</script>
