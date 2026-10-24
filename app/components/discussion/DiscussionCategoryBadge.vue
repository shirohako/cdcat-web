<script setup lang="ts">
import type { DiscussionCategorySummary } from '~/types/discussion'

/** A category chip in the category's colour, linking to the category. */
const props = withDefaults(defineProps<{ category: DiscussionCategorySummary | null, link?: boolean, size?: 'xs' | 'sm' }>(), { link: true, size: 'xs' })
const { categoryName } = useDiscussionCategories()
const tone = computed(() => categoryTone(props.category?.color))
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="link ? NuxtLink : 'span'" v-if="category"
    :to="link ? `/discussions/c/${category.slug}` : undefined"
    class="inline-flex max-w-full items-center gap-1 rounded-md font-medium transition duration-150 ease-out hover:brightness-95 dark:hover:brightness-125"
    :class="[tone.chip, size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs']"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="tone.dot" aria-hidden="true" />
    <span class="truncate">{{ categoryName(category) }}</span>
  </component>
</template>
