<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('tracking.widget.title')" :icon="ListChecks" class="px-5 pb-2 pt-4" />

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-5">
      <span class="loading loading-spinner loading-sm"/>
    </div>

    <!-- 状态选择 -->
    <div v-else class="px-5 py-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in statusOptions"
          :key="option.status"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors duration-150 ease-out"
          :class="currentStatus === option.status ? option.activeClass : option.defaultClass"
          @click="handleStatusClick(option.status)"
        >
          <Icon :name="option.icon" class="w-4 h-4 shrink-0" :class="currentStatus === option.status ? option.activeIconClass : option.iconClass" />
          <span>{{ option.label }}</span>
        </button>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center mt-4 pt-3 border-t border-line" :class="currentStatus ? 'justify-between' : 'justify-end'">
        <UiButton v-if="currentStatus" variant="danger-soft" size="xs" icon="lucide:x" @click="handleRemoveTracking">
          {{ $t('tracking.widget.remove') }}
        </UiButton>
        <UiButton to="/tracking" size="xs" icon-right="lucide:arrow-right">
          {{ $t('tracking.widget.manage') }}
        </UiButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ListChecks } from '@lucide/vue'
import type { TrackingStatus } from '~/types/tracking'

const props = defineProps<{
  albumId: string | number
  initialTracking?: { status: TrackingStatus; created_at?: string; updated_at?: string } | null
}>()

const emit = defineEmits<{ tracked: [status: TrackingStatus | null] }>()

const { isAuthenticated } = useAuth()
const { getAlbumTracking, setAlbumTracking, deleteAlbumTracking } = useTracking()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const currentStatus = ref<TrackingStatus | null>(props.initialTracking?.status ?? null)
// The page may swap in a fresher copy of the album after this has rendered (revisit cache).
watch(() => props.initialTracking?.status ?? null, (status) => {
  if (!loading.value) currentStatus.value = status
})

const statusOptions = computed(() => [
  {
    status: 'plan_to_listen' as TrackingStatus,
    label: t('tracking.status.plan_to_listen'),
    icon: 'lucide:headphones',
    defaultClass: 'border-blue-100 bg-blue-50/50 text-blue-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/15 dark:hover:text-blue-200',
    activeClass: 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-400/60 dark:bg-blue-400/20 dark:text-blue-200',
    iconClass: 'text-blue-300 dark:text-blue-400/70',
    activeIconClass: 'text-blue-500 dark:text-blue-300',
  },
  {
    status: 'completed' as TrackingStatus,
    label: t('tracking.status.completed'),
    icon: 'lucide:check-circle',
    defaultClass: 'border-teal-200 bg-teal-50 text-teal-600 hover:border-teal-400 hover:bg-teal-100 hover:text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300 dark:hover:border-teal-400/50 dark:hover:bg-teal-400/20 dark:hover:text-teal-200',
    activeClass: 'border-teal-500 bg-teal-100 text-teal-800 dark:border-teal-400/70 dark:bg-teal-400/25 dark:text-teal-100',
    iconClass: 'text-teal-400 dark:text-teal-400/70',
    activeIconClass: 'text-teal-600 dark:text-teal-300',
  },
  {
    status: 'wishlist' as TrackingStatus,
    label: t('tracking.status.wishlist'),
    icon: 'lucide:bookmark',
    defaultClass: 'border-orange-100 bg-orange-50/50 text-orange-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300 dark:hover:border-orange-400/40 dark:hover:bg-orange-400/15 dark:hover:text-orange-200',
    activeClass: 'border-orange-400 bg-orange-100 text-orange-600 dark:border-orange-400/60 dark:bg-orange-400/20 dark:text-orange-200',
    iconClass: 'text-orange-300 dark:text-orange-400/70',
    activeIconClass: 'text-orange-400 dark:text-orange-300',
  },
  {
    status: 'owned' as TrackingStatus,
    label: t('tracking.status.owned'),
    icon: 'lucide:package',
    defaultClass: 'border-purple-100 bg-purple-50/50 text-purple-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 dark:hover:border-purple-400/40 dark:hover:bg-purple-400/15 dark:hover:text-purple-200',
    activeClass: 'border-purple-400 bg-purple-100 text-purple-700 dark:border-purple-400/60 dark:bg-purple-400/20 dark:text-purple-200',
    iconClass: 'text-purple-300 dark:text-purple-400/70',
    activeIconClass: 'text-purple-500 dark:text-purple-300',
  },
  {
    status: 'dropped' as TrackingStatus,
    label: t('tracking.status.dropped'),
    icon: 'lucide:x-circle',
    // Not a colour of its own: the theme's neutrals.
    defaultClass: 'border-line bg-sunken text-meta hover:bg-btn hover:text-body',
    activeClass: 'border-faint bg-btn text-title',
    iconClass: 'text-faint',
    activeIconClass: 'text-meta',
  },
])

const fetchCurrentStatus = async () => {
  if (!isAuthenticated.value) return
  // 如果已有初始数据，跳过请求
  if (currentStatus.value !== null) return

  loading.value = true
  try {
    const result = await getAlbumTracking(Number(props.albumId))
    currentStatus.value = result.status
  } catch (error) {
    console.error('Failed to fetch tracking status:', error)
  } finally {
    loading.value = false
  }
}

const handleStatusClick = async (status: TrackingStatus) => {
  // 未登录时跳转到登录页
  if (!isAuthenticated.value) {
    router.push({ path: '/auth/login', query: { redirect: route.fullPath } })
    return
  }

  // 如果点击的是当前状态，不做任何操作
  if (currentStatus.value === status) return

  loading.value = true
  try {
    await setAlbumTracking(Number(props.albumId), status)
    currentStatus.value = status
    emit('tracked', status)
  } catch (error) {
    console.error('Failed to update tracking status:', error)
  } finally {
    loading.value = false
  }
}

const handleRemoveTracking = async () => {
  if (!currentStatus.value) return

  loading.value = true
  try {
    await deleteAlbumTracking(Number(props.albumId))
    currentStatus.value = null
    emit('tracked', null)
  } catch (error) {
    console.error('Failed to remove tracking:', error)
  } finally {
    loading.value = false
  }
}

// On client-side navigation start at once; after a server render, wait until hydration is done so the
// first render matches the server's.
if (import.meta.client && !useNuxtApp().isHydrating) fetchCurrentStatus()
else onMounted(fetchCurrentStatus)

watch(() => props.albumId, () => {
  fetchCurrentStatus()
})
</script>
