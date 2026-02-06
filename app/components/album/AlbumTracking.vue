<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <ListChecks :size="20" />
      {{ $t('tracking.widget.title') }}
    </h3>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-4">
      <span class="loading loading-spinner loading-sm"></span>
    </div>

    <!-- 状态选择 -->
    <div v-else>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in statusOptions"
          :key="option.status"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200"
          :class="currentStatus === option.status
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'"
          @click="handleStatusClick(option.status)"
        >
          <Icon :name="option.icon" class="w-4 h-4 shrink-0" :class="currentStatus === option.status ? 'text-blue-500' : 'text-gray-400'" />
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
}>()

const { isAuthenticated } = useAuth()
const { getWorkTracking, setWorkTracking, deleteWorkTracking } = useTracking()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const currentStatus = ref<TrackingStatus | null>(null)

const statusOptions = computed(() => [
  { status: 'plan_to_listen' as TrackingStatus, label: t('tracking.status.plan_to_listen'), icon: 'lucide:headphones' },
  { status: 'completed' as TrackingStatus, label: t('tracking.status.completed'), icon: 'lucide:check-circle' },
  { status: 'wishlist' as TrackingStatus, label: t('tracking.status.wishlist'), icon: 'lucide:bookmark' },
  { status: 'owned' as TrackingStatus, label: t('tracking.status.owned'), icon: 'lucide:package' },
  { status: 'dropped' as TrackingStatus, label: t('tracking.status.dropped'), icon: 'lucide:x-circle' }
])

const fetchCurrentStatus = async () => {
  if (!isAuthenticated.value) return

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
    router.push({ path: '/login', query: { redirect: route.fullPath } })
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
