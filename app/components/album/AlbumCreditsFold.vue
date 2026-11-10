<template>
  <button
    type="button"
    class="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-13 font-semibold text-title transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
    :aria-expanded="open"
  >
    <ChevronRight :size="15" class="shrink-0 text-meta transition-transform duration-200" :class="open && 'rotate-90'" />
    {{ title }}
    <UiBadge class="ml-0.5">{{ countText }}</UiBadge>
  </button>
</template>

<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'

/**
 * The fold header of the credits card's two lists: an arrow, the list's name and a tag with how many people are in it
 * (the bare number, no unit), those with no artist page (仅署名, names only) counted again in brackets when there are any.
 */
const props = withDefaults(defineProps<{ open: boolean, title: string, count: number, nameOnly?: number }>(), { nameOnly: 0 })

const { t } = useI18n()
const countText = computed(() => {
  return props.nameOnly ? `${props.count} ${t('album.track_people.name_only_count', { count: props.nameOnly })}` : String(props.count)
})
</script>
