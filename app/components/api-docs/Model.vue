<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { modelId } from '~/api-docs/keys'
import type { ModelSpec } from '~/api-docs/types'

/** An object the endpoints return: its name, what it is, and its fields; one it extends comes first, as a link. */
const props = defineProps<{ model: ModelSpec, flash: boolean }>()

const docs = useApiDocs()
const text = computed(() => docs.value.texts.models[props.model.name] ?? { title: '', description: '', fields: {} })
const labels = computed(() => docs.value.texts.labels)
const extendsLabel = computed(() => labels.value.extends.split('{model}'))
</script>

<template>
  <article :id="modelId(model.name)" class="scroll-mt-36 border-t border-line pt-6 lg:scroll-mt-20">
    <header class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span class="tag rounded-sm bg-sunken px-1.5 py-0.5 text-[11px] font-medium text-meta ring-1 ring-line" :class="{ 'is-flashing': flash }">{{ labels.model }}</span>
      <h3 class="font-mono text-[17px] font-semibold text-title">{{ model.name }}</h3>
      <span class="text-sm text-meta">{{ text.title }}</span>
    </header>
    <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
    <p class="mt-2 text-[15px] leading-7 text-body" v-html="docs.inline(text.description)" />
    <p v-if="model.extends" class="mt-3 text-sm text-body">
      {{ extendsLabel[0] }}<ApiDocsType :type="model.extends" />{{ extendsLabel[1] }}
    </p>
    <ApiDocsFields :fields="model.fields" :texts="text.fields" class="mt-3" />
  </article>
</template>

<style scoped>
.tag.is-flashing {
  animation: flash 900ms ease-out;
}

@keyframes flash {
  20% {
    background-color: var(--accent);
    color: var(--on-accent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tag.is-flashing {
    animation: none;
  }
}
</style>
