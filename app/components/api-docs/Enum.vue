<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { enumId } from '~/api-docs/keys'
import type { EnumSpec } from '~/api-docs/types'

/** A fixed set of values: the enum's name, what it is for, and what each value means. */
const props = defineProps<{ spec: EnumSpec }>()

const docs = useApiDocs()
const text = computed(() => docs.value.texts.enums[props.spec.name] ?? { title: '', description: '', values: {} })
const labels = computed(() => docs.value.texts.labels)
</script>

<template>
  <article :id="enumId(spec.name)" class="scroll-mt-36 rounded-md bg-sunken p-4 ring-1 ring-line lg:scroll-mt-20">
    <header class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span class="rounded-sm bg-card px-1.5 py-0.5 text-[11px] font-medium text-meta ring-1 ring-line">{{ labels.enum }}</span>
      <h3 class="font-mono text-[15px] font-semibold text-title">{{ spec.name }}</h3>
      <span class="text-sm text-meta">{{ text.title }}</span>
    </header>
    <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
    <p class="mt-1.5 text-sm leading-6 text-body" v-html="docs.inline(text.description)" />
    <dl class="mt-2.5 grid gap-x-4 gap-y-1 text-sm leading-6 sm:grid-cols-[auto_minmax(0,1fr)]">
      <template v-for="value in spec.values" :key="value">
        <dt><code class="font-mono text-[13px] text-title">{{ value }}</code></dt>
        <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
        <dd class="min-w-0 pb-1 text-body sm:pb-0" v-html="docs.inline(text.values[value])" />
      </template>
    </dl>
  </article>
</template>
