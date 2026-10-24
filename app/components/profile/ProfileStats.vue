<template>
  <section class="card animate-fade-in-up-slow p-5">
    <header class="mb-5 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold leading-6 text-title">{{ $t('tracking.widget.title') }}</h2>
      <p class="shrink-0 text-xs text-meta">{{ totalCount }} {{ $t('profile.total') }}</p>
    </header>

    <div class="divide-y divide-line">
      <button
        v-for="stat in statCards"
        :key="stat.status"
        class="group flex w-full items-center justify-between rounded-lg px-1 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active cursor-pointer"
        @click="$emit('select-status', stat.status)"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            :class="stat.iconBg"
          >
            <component :is="stat.icon" :size="15" :class="stat.iconColor" />
          </span>
          <p class="text-sm font-medium text-body">{{ stat.label }}</p>
        </div>
        <div class="flex items-center gap-2">
          <p class="tabular-nums text-lg font-bold text-title">{{ stat.value }}</p>
          <ChevronRight :size="14" class="text-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { Bookmark, CheckCircle, ChevronRight, Headphones, Package, XCircle } from '@lucide/vue'

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
  { status: 'plan_to_listen', label: t('tracking.status.plan_to_listen'), value: props.stats.plan_to_listen, icon: Headphones, iconBg: 'bg-sky-50 dark:bg-sky-400/15', iconColor: 'text-sky-600 dark:text-sky-400' },
  { status: 'completed', label: t('tracking.status.completed'), value: props.stats.completed, icon: CheckCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-400/15', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { status: 'wishlist', label: t('tracking.status.wishlist'), value: props.stats.wishlist, icon: Bookmark, iconBg: 'bg-amber-50 dark:bg-amber-400/15', iconColor: 'text-amber-600 dark:text-amber-400' },
  { status: 'owned', label: t('tracking.status.owned'), value: props.stats.owned, icon: Package, iconBg: 'bg-indigo-50 dark:bg-indigo-400/15', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  { status: 'dropped', label: t('tracking.status.dropped'), value: props.stats.dropped, icon: XCircle, iconBg: 'bg-rose-50 dark:bg-rose-400/15', iconColor: 'text-rose-600 dark:text-rose-400' }
])
</script>
