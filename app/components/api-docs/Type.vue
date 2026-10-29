<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { modelId } from '~/api-docs/keys'

/**
 * A field's type as the reference writes it (`AlbumSimple[] | null`), its model names linked to their definitions.
 * One string of HTML (the text escaped), as the page shows several hundred of them.
 */
const props = defineProps<{ type: string }>()
const docs = useApiDocs()

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const html = computed(() => props.type.split(/([A-Z][A-Za-z]+)/).filter(Boolean)
  .map(text => docs.value.models.has(text) ? `<a href="#${modelId(text)}">${escape(text)}</a>` : escape(text))
  .join(''))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- the structure's own type names, escaped -->
  <span class="ad-type" v-html="html" />
</template>
