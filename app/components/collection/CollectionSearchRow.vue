<script setup lang="ts">
/** A list page's search row (CollectionPageHeader): the box, its button, then the default slot (the pending switch). */
defineProps<{ placeholder: string }>()

const emit = defineEmits<{
  /** Enter or the button. */
  submit: []
}>()

const search = defineModel<string>({ required: true })
</script>

<template>
  <form class="flex flex-wrap items-center gap-2" role="search" @submit.prevent="emit('submit')">
    <label class="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-lg bg-field px-3 ring-1 ring-line focus-within:ring-primary">
      <Icon name="lucide:search" class="h-4 w-4 shrink-0 text-faint" />
      <input
        v-model="search"
        type="search"
        maxlength="100"
        class="min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-faint"
        :placeholder="placeholder"
        :aria-label="placeholder"
      >
    </label>
    <UiButton type="submit" variant="primary" size="sm" class="shrink-0">{{ $t('catalog.search') }}</UiButton>
    <slot />
  </form>
</template>
