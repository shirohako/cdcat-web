<script setup lang="ts">
import { Info } from '@lucide/vue'

/**
 * A credit's note (`detail`), free text for readers: an ⓘ beside the name, the text in its tooltip, so notes never crowd
 * the names. A tap shows it on touch screens. Attributes go to the tooltip, so spacing belongs on a wrapper.
 */
defineProps<{
  note: string
  /** Inside a coloured role tag: the tag's own colour, a little faded, instead of grey */
  tinted?: boolean
}>()
</script>

<template>
  <!-- The plain text bubble, not the rich one (that one's 12px padding is for covers and lists, and boxed a short note
       like "CD"); line breaks kept, a long word broken -->
  <UiTooltip :text="note" :delay="150" class="whitespace-pre-line wrap-break-word">
    <!-- Tinted, it matches the tag's bold 11px text: a 12px box, a heavier 11px circle, and half a pixel down, as the
         text's letters sit about that far below the middle of its line -->
    <span
      tabindex="0"
      role="img"
      :aria-label="note"
      class="inline-grid shrink-0 cursor-help place-items-center rounded-full align-middle transition duration-150"
      :class="tinted ? 'size-3 translate-y-[0.5px] opacity-75 hover:opacity-100' : 'size-3.5 text-meta hover:text-title'"
    >
      <!-- 11px in either case: at 12px the circle stood as tall as the 12px text beside it and looked heavy -->
      <Info :size="11" :stroke-width="tinted ? 2.5 : 2" />
    </span>
  </UiTooltip>
</template>
