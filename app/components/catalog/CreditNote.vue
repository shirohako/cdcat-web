<script setup lang="ts">
/**
 * A credit's note (`detail`), free text for readers: an ⓘ beside the name, the text in its tooltip, so notes never crowd
 * the names. A tap shows it on touch screens. Attributes go to the tooltip, so spacing belongs on a wrapper.
 */
defineProps<{ note: string }>()
</script>

<template>
  <UiTooltip :delay="150">
    <span tabindex="0" role="img" :aria-label="note" class="inline-grid size-3.5 shrink-0 cursor-help place-items-center rounded-full align-middle text-meta transition-colors duration-150 hover:text-title">
      <Icon name="lucide:info" class="size-3" />
    </span>
    <template #content>
      <p class="whitespace-pre-line wrap-break-word text-xs leading-5 text-title">{{ note }}</p>
    </template>
  </UiTooltip>
</template>
