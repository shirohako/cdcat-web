<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <ListChecks :size="15" class="text-blue-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('tracking.widget.title') }}</h2>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-5">
      <span class="loading loading-spinner loading-sm"></span>
    </div>

    <!-- 状态选择 -->
    <div v-else class="px-5 py-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in statusOptions"
          :key="option.status"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200"
          :class="currentStatus === option.status ? option.activeClass : option.defaultClass"
          @click="handleStatusClick(option.status)"
        >
          <Icon :name="option.icon" class="w-4 h-4 shrink-0" :class="currentStatus === option.status ? option.activeIconClass : option.iconClass" />
          <span>{{ option.label }}</span>
        </button>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center mt-4 pt-3 border-t border-gray-100" :class="currentStatus ? 'justify-between' : 'justify-end'">
        <button
          v-if="currentStatus"
          class="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          @click="handleRemoveTracking"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
          <span>{{ $t('tracking.widget.remove') }}</span>
        </button>
        <NuxtLink
          to="/tracking"
          class="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
        >
          <span>{{ $t('tracking.widget.manage') }}</span>
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ListChecks } from 'lucide-vue-next'
import type { TrackingStatus } from '~/types/tracking'

const props = defineProps<{
  workId: string | number
  initialTracking?: { status: number; created_at?: string; updated_at?: string } | null
}>()

const { isAuthenticated } = useAuth()
const { getWorkTracking, setWorkTracking, deleteWorkTracking } = useTracking()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 数字 -> 状态映射
const numberToStatus: Record<number, TrackingStatus> = {
  1: 'plan_to_listen',
  2: 'completed',
  3: 'wishlist',
  4: 'owned',
  5: 'dropped'
}

const loading = ref(false)
const initialStatus = props.initialTracking?.status
  ? numberToStatus[props.initialTracking.status] ?? null
  : null
const currentStatus = ref<TrackingStatus | null>(initialStatus)

const statusOptions = computed(() => [
  {
    status: 'plan_to_listen' as TrackingStatus,
    label: t('tracking.status.plan_to_listen'),
    icon: 'lucide:headphones',
    defaultClass: 'border-blue-100 bg-blue-50/50 text-blue-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600',
    activeClass: 'border-blue-400 bg-blue-100 text-blue-700',
    iconClass: 'text-blue-300',
    activeIconClass: 'text-blue-500',
  },
  {
    status: 'completed' as TrackingStatus,
    label: t('tracking.status.completed'),
    icon: 'lucide:check-circle',
    defaultClass: 'border-teal-200 bg-teal-50 text-teal-600 hover:border-teal-400 hover:bg-teal-100 hover:text-teal-700',
    activeClass: 'border-teal-500 bg-teal-100 text-teal-800',
    iconClass: 'text-teal-400',
    activeIconClass: 'text-teal-600',
  },
  {
    status: 'wishlist' as TrackingStatus,
    label: t('tracking.status.wishlist'),
    icon: 'lucide:bookmark',
    defaultClass: 'border-orange-100 bg-orange-50/50 text-orange-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500',
    activeClass: 'border-orange-400 bg-orange-100 text-orange-600',
    iconClass: 'text-orange-300',
    activeIconClass: 'text-orange-400',
  },
  {
    status: 'owned' as TrackingStatus,
    label: t('tracking.status.owned'),
    icon: 'lucide:package',
    defaultClass: 'border-purple-100 bg-purple-50/50 text-purple-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600',
    activeClass: 'border-purple-400 bg-purple-100 text-purple-700',
    iconClass: 'text-purple-300',
    activeIconClass: 'text-purple-500',
  },
  {
    status: 'dropped' as TrackingStatus,
    label: t('tracking.status.dropped'),
    icon: 'lucide:x-circle',
    defaultClass: 'border-gray-200 bg-gray-50/50 text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600',
    activeClass: 'border-gray-400 bg-gray-100 text-gray-700',
    iconClass: 'text-gray-300',
    activeIconClass: 'text-gray-500',
  },
])

const fetchCurrentStatus = async () => {
  if (!isAuthenticated.value) return
  // 如果已有初始数据，跳过请求
  if (currentStatus.value !== null) return

  loading.value = true
  try {
    const result = await getWorkTracking(Number(props.workId))
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
    await setWorkTracking(Number(props.workId), status)
    currentStatus.value = status
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
    await deleteWorkTracking(Number(props.workId))
    currentStatus.value = null
  } catch (error) {
    console.error('Failed to remove tracking:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCurrentStatus()
})

watch(() => props.workId, () => {
  fetchCurrentStatus()
})
</script>
