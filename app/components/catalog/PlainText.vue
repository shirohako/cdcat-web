<script setup lang="ts">
import { textParts } from '~/utils/textParts'

/**
 * Text people paste from shop pages and booklets, full of indents and decorative rules that Markdown would take for
 * code blocks, headings and emphasis: shown as written, with its addresses as links and the look of RichContent. A
 * click on an address opens the external link card.
 */
const props = defineProps<{ text: string }>()
const parts = computed(() => textParts(props.text))
const { onClick } = useExternalLink()
</script>

<template>
  <div class="markdown-body markdown-body-sm">
    <p class="whitespace-pre-wrap"><template v-for="(part, index) in parts" :key="index"><a v-if="part.href" :href="part.href" target="_blank" rel="nofollow ugc noopener noreferrer" @click="onClick($event, { url: part.href! })">{{ part.text }}</a><template v-else>{{ part.text }}</template></template></p>
  </div>
</template>
