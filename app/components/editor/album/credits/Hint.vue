<template>
  <!-- Dark on either theme: the tooltips' colours on a light page; on a dark one it mustn't turn into a bright sheet. -->
  <div data-theme="dark" class="rounded-lg bg-popover px-3 pb-3 pt-2 text-xs leading-5 text-title shadow-sm ring-1 ring-line">
    <div class="flex items-center gap-1.5">
      <Lightbulb :size="14" class="shrink-0 text-primary" />
      <span class="font-semibold">{{ t('editor.credits.hint_title') }}</span>
      <UiButton variant="ghost" icon="lucide:x" :label="t('common.close')" size="xs" class="-mr-1.5 ml-auto shrink-0" @click="emit('close')" />
    </div>
    <p v-if="text" class="mt-1 whitespace-pre-line">{{ text }}</p>
    <div v-if="$slots.default" class="mt-1.5"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { Lightbulb } from '@lucide/vue'

/** A notice of 参与创作的人: a title with a button to close it, then a text or anything else in its slot, full width. */
defineProps<{ text?: string }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
</script>
