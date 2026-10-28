<script setup lang="ts">
/** A stand-in avatar for the guide's forum: a person's outline on a tint, never initials. */
defineProps<{ shift: number }>()
</script>

<template>
  <span class="accent grid size-7 shrink-0 place-items-center rounded-full bg-(--accent-soft) text-(--accent)" :style="{ '--shift': shift }">
    <Icon name="lucide:user-round" class="size-4" />
  </span>
</template>
