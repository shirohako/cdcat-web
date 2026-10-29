<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { enumId } from '~/api-docs/keys'
import type { ParamSpec } from '~/api-docs/types'

/**
 * An endpoint's path or query parameters, one row each: the name and type on the left, the description and its
 * default, range and allowed values on the right. Row styles are in api-docs.css.
 */
defineProps<{ params: ParamSpec[], label: string, texts: Record<string, string> | undefined }>()

const docs = useApiDocs()
const labels = computed(() => docs.value.texts.labels)
const seeLabel = computed(() => labels.value.see.split('{name}'))
</script>

<template>
  <section class="mt-6">
    <h4 class="text-[13px] font-semibold text-meta">{{ label }}</h4>
    <dl class="ad-rows mt-2">
      <div v-for="param in params" :key="param.name" class="ad-row">
        <dt class="ad-key">
          <code class="ad-name">{{ param.name }}</code>
          <ApiDocsType :type="param.type" />
          <span v-if="param.required" class="ad-required">{{ labels.required }}</span>
        </dt>
        <dd class="ad-desc">
          <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
          <span v-html="docs.inline(docs.paramText(param, texts))" />
          <span v-if="param.default || param.range || param.values || param.enum" class="ad-chips">
            <span v-if="param.default" class="ad-chip">{{ labels.default.replace('{value}', param.default) }}</span>
            <span v-if="param.range" class="ad-chip">{{ param.range }}</span>
            <code v-for="value in param.values" :key="value" class="ad-chip">{{ value }}</code>
            <a v-if="param.enum" :href="`#${enumId(param.enum)}`" class="ad-chip">{{ seeLabel[0] }}{{ param.enum }}{{ seeLabel[1] }}</a>
          </span>
        </dd>
      </div>
    </dl>
  </section>
</template>
