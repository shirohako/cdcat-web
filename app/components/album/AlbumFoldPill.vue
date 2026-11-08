<template>
  <!-- Floats at the bottom of the screen while the list is in view and settles at its end; only the pill takes clicks.
       In the inverted theme like the tooltips, so it reads as a control above the page; a light shadow; on hover a slightly lighter fill and the arrow below. -->
  <div class="pointer-events-none sticky bottom-5 z-10 flex justify-center pt-4 transition-[opacity,visibility] duration-150" :class="!shown && 'invisible opacity-0'">
    <UiButton
      :data-theme="pillTheme"
      class="group/fold pointer-events-auto h-7 min-h-7 gap-1 rounded-md border-0 bg-popover pl-2 pr-2.5 text-11.5 font-semibold text-title shadow-[0_2px_8px_-2px_oklch(0_0_0/0.25)] ring-1 ring-line transition-colors duration-150 hover:bg-card-hover"
      @click="$emit('click')"
    >
      <!-- On hover the arrow slides up out of its slot and a second one rises in from below, once, like the list
           folding upwards; reduced motion keeps the arrow still. -->
      <span class="relative size-3.25 shrink-0 overflow-hidden" aria-hidden="true">
        <ChevronUp :size="13" class="absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fold:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover/fold:translate-y-0" />
        <ChevronUp :size="13" class="absolute inset-0 translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fold:translate-y-0 motion-reduce:hidden" />
      </span>
      {{ label }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { ChevronUp } from '@lucide/vue'

/** The floating 收起 button of a long list on the album page, in the theme opposite the page's. Not `shown`, it keeps its room, so the page doesn't move when it appears. */
withDefaults(defineProps<{ label: string, shown?: boolean }>(), { shown: true })
defineEmits<{ click: [] }>()

const { theme } = useAppearance()
const pillTheme = computed(() => theme.value === 'dark' ? 'light' : 'dark')
</script>
