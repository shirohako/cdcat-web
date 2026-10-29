<script setup lang="ts">
/**
 * A form's steps as the tracks of the record beside it: one bar per step, as long as its track on the record, filled
 * once done, the current one playing in the record's colour (--auth-tint). Finished steps can be pressed to go back.
 * Below sm it is one line and a progress bar.
 */
const props = withDefaults(defineProps<{
  steps: string[]
  /** 1-based */
  current: number
  /** every step done, the last one too */
  finished?: boolean
  /** each step's share of the bar; the record's own tracks when there are five */
  shares?: number[]
}>(), { finished: false, shares: undefined })

const emit = defineEmits<{ go: [step: number] }>()
const { t } = useI18n()

const total = computed(() => props.steps.length)
const widths = computed(() => props.shares ?? (total.value === VINYL_TRACK_SHARES.length ? VINYL_TRACK_SHARES : props.steps.map(() => 1)))
const done = (step: number) => props.finished || step < props.current
</script>

<template>
  <nav :aria-label="t('auth.steps.label')">
    <div class="flex flex-col gap-2 max-sm:hidden">
      <div class="flex items-center gap-2.5">
        <span class="font-mono text-[11px] font-bold tracking-wider text-meta">SIDE A</span>
        <ol class="flex flex-1 gap-1">
          <li v-for="(name, i) in steps" :key="name" class="min-w-0 basis-0" :style="{ flexGrow: widths[i] }">
            <button
              type="button"
              class="relative block h-1.5 w-full overflow-hidden rounded-full transition-colors disabled:cursor-default"
              :class="done(i + 1) ? 'bg-primary enabled:hover:bg-primary/70' : 'bg-line'"
              :disabled="!done(i + 1) || finished"
              :aria-current="i + 1 === current && !finished ? 'step' : undefined"
              :aria-label="t('auth.steps.go', { n: i + 1, name })"
              @click="emit('go', i + 1)"
            >
              <span v-if="i + 1 === current && !finished" class="auth-tracks-now absolute inset-0 rounded-full bg-(--auth-tint)" />
            </button>
          </li>
        </ol>
        <span class="font-mono text-[11px] font-bold tabular-nums text-meta">{{ current }} / {{ total }}</span>
      </div>
      <p class="flex items-center gap-2 text-[13px] font-semibold text-title">
        <span v-if="!finished" class="auth-tracks-eq" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>A{{ current }} · {{ steps[current - 1] }}</span>
        <span class="rounded-full bg-(--auth-tint)/10 px-2 py-px text-[11.5px] font-semibold text-(--auth-tint)">{{ finished ? t('auth.steps.finished') : t('auth.steps.playing') }}</span>
      </p>
    </div>
    <div class="flex flex-col gap-2 sm:hidden">
      <p class="flex justify-between gap-3 text-[13px] font-semibold text-title">
        <span>{{ t('auth.steps.short', { n: current, total, name: steps[current - 1] }) }}</span>
        <span class="font-normal tabular-nums text-meta">{{ Math.round(((finished ? total : current) / total) * 100) }}%</span>
      </p>
      <div class="h-1 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-primary transition-[width] duration-500" :style="{ width: `${((finished ? total : current) / total) * 100}%` }" />
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* The current track plays: its fill creeps along and back */
.auth-tracks-now {
  transform-origin: left;
  animation: auth-tracks-play 7s ease-in-out infinite alternate;
}

.auth-tracks-eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.auth-tracks-eq i {
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background: var(--auth-tint);
  transform-origin: bottom;
  animation: auth-tracks-eq 0.8s ease-in-out infinite alternate;
}

.auth-tracks-eq i:nth-child(2) { animation-delay: -0.3s; }
.auth-tracks-eq i:nth-child(3) { animation-delay: -0.55s; }
.auth-tracks-eq i:nth-child(4) { animation-delay: -0.15s; }

@keyframes auth-tracks-play {
  from { transform: scaleX(0.18); }
  to { transform: scaleX(0.72); }
}

@keyframes auth-tracks-eq {
  from { transform: scaleY(0.3); }
  to { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .auth-tracks-now,
  .auth-tracks-eq i {
    animation: none;
  }

  .auth-tracks-now {
    transform: scaleX(0.4);
  }
}
</style>
