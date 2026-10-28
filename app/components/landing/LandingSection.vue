<template>
  <section
    :class="[
      'grid items-center gap-4 xl:gap-10',
      card ? 'rounded-2xl bg-card px-5 py-7 sm:p-8 xl:p-10' : 'px-1 py-6 sm:px-3 xl:py-8',
      flip ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]' : 'xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'
    ]"
  >
    <div :class="['max-w-xl', { 'xl:order-last': !flip }]">
      <p class="text-[0.8125rem] font-bold tracking-[0.14em] text-meta">{{ kicker }}</p>
      <h2 class="landing-display mt-3 whitespace-pre-line text-[2.25rem] leading-[1.15] text-title sm:text-[2.75rem]">{{ title }}</h2>
      <!-- Medium and in the title colour, so it holds up beside the heavy display face (fonts without a medium,
           such as Microsoft YaHei, still get the darker colour). -->
      <p class="mt-4 text-base font-medium leading-[1.9] text-title">{{ body }}</p>
      <ul v-if="tags.length" class="mt-6 flex flex-wrap gap-2">
        <li
          v-for="tag in tags"
          :key="tag.text"
          class="landing-tag"
          :style="{ background: `var(--landing-${tag.tone})` }"
        >
          {{ tag.text }}
        </li>
      </ul>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
/**
 * A section of the home page: a kicker, a display title, a paragraph and pastel tags beside one of the exploded
 * drawings (the default slot). The drawing comes first on wide screens unless `flip`; on narrow ones the words come
 * first.
 */
withDefaults(defineProps<{
  kicker: string
  title: string
  body: string
  tags?: { text: string, tone: string }[]
  /** Words on the left, drawing on the right. */
  flip?: boolean
  /** On a card, to set it apart from the sections around it. */
  card?: boolean
}>(), { tags: () => [], flip: false, card: false })
</script>

<style scoped>
/* Pastel tags in the home page's palette (pages/index.vue), the same in both themes. */
.landing-tag {
  border-radius: 0.375rem;
  padding: 0.45rem 0.7rem;
  color: var(--landing-ink);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
}
</style>
