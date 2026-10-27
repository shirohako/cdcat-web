<script setup lang="ts">
/**
 * A short search field for a list's filter bar, 30px high: Enter searches, and so does the magnifier, which is its
 * button. Focused, it lifts: the card colour, a theme-colour ring with a soft halo, a light shadow, and the magnifier
 * in the theme colour. Classes go to the form, which sets no display of its own: pass `flex` (or `hidden sm:flex`) and a width.
 */
defineProps<{ placeholder: string }>()

const emit = defineEmits<{
  submit: []
}>()

const search = defineModel<string>({ required: true })
</script>

<template>
  <form
    role="search"
    class="group/search h-7.5 items-center rounded-md bg-black/[0.045] ring-1 ring-inset ring-transparent transition-[background-color,box-shadow] duration-200 ease-out focus-within:bg-card focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_14%,transparent),0_4px_12px_-4px_rgb(0_0_0/0.18)] focus-within:ring-primary dark:bg-white/[0.06] dark:focus-within:bg-card"
    @submit.prevent="emit('submit')"
  >
    <button type="submit" class="grid h-full w-8 shrink-0 place-items-center text-faint transition-colors duration-200 hover:text-primary group-focus-within/search:text-primary" :aria-label="$t('catalog.search')">
      <Icon name="lucide:search" class="size-3.5" />
    </button>
    <input
      v-model="search"
      type="search"
      maxlength="100"
      class="h-full min-w-0 flex-1 bg-transparent pr-2.5 text-[13px] text-title outline-none placeholder:text-faint"
      :placeholder="placeholder"
      :aria-label="placeholder"
    >
  </form>
</template>
