<template>
  <section class="animate-fade-in-up-slow rounded-2xl border border-black/5 bg-white/75 p-5 shadow-sm backdrop-blur-xl">
    <header class="mb-5 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold leading-6 text-gray-900">{{ $t('tracking.widget.title') }}</h2>
      <p class="shrink-0 text-xs text-gray-500">{{ totalCount }} {{ $t('profile.total') }}</p>
    </header>

    <div class="divide-y divide-gray-100">
      <button
        v-for="stat in statCards"
        :key="stat.status"
        class="group flex w-full items-center justify-between rounded-lg px-1 py-2.5 transition-colors hover:bg-gray-50/80 cursor-pointer"
        @click="$emit('select-status', stat.status)"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            :class="stat.iconBg"
          >
            <component :is="stat.icon" :size="15" :class="stat.iconColor" />
          </span>
          <p class="text-sm font-medium text-gray-700">{{ stat.label }}</p>
        </div>
        <div class="flex items-center gap-2">
          <p class="tabular-nums text-lg font-bold text-gray-900">{{ stat.value }}</p>
          <ChevronRight :size="14" class="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { Bookmark, CheckCircle, ChevronRight, Headphones, Package, XCircle } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

defineEmits(['select-status'])

const totalCount = computed(() =>
  (props.stats.plan_to_listen || 0) + (props.stats.completed || 0) + (props.stats.wishlist || 0) + (props.stats.owned || 0) + (props.stats.dropped || 0)
)

const statCards = computed(() => [
  { status: 1, label: t('tracking.status.plan_to_listen'), value: props.stats.plan_to_listen, icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
  { status: 2, label: t('tracking.status.completed'), value: props.stats.completed, icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { status: 3, label: t('tracking.status.wishlist'), value: props.stats.wishlist, icon: Bookmark, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { status: 4, label: t('tracking.status.owned'), value: props.stats.owned, icon: Package, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { status: 5, label: t('tracking.status.dropped'), value: props.stats.dropped, icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }
])
</script>
