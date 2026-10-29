<script setup lang="ts">
/** Sign-up step 1: CDCat is a catalogue about music, not a place to download or stream it. */
defineEmits<{ next: [] }>()

const POINTS = [
  { key: 'no_audio', icon: 'lucide:library' },
  { key: 'support', icon: 'lucide:heart' },
] as const
</script>

<template>
  <div class="flex flex-col gap-5">
    <ul class="flex flex-col gap-2.5">
      <li v-for="point in POINTS" :key="point.key" class="flex items-start gap-3 rounded-lg bg-sunken p-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-card text-(--auth-tint)">
          <UiIcon :icon="point.icon" class="size-[18px]" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-bold text-title">{{ $t(`auth.register.notice.${point.key}_title`) }}</p>
          <p class="text-[13px] leading-relaxed text-body">{{ $t(`auth.register.notice.${point.key}`) }}</p>
        </div>
      </li>
    </ul>
    <UiButton variant="primary" size="lg" block class="rounded-md" @click="$emit('next')">{{ $t('auth.register.notice.confirm') }}</UiButton>
  </div>
</template>
