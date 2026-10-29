<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { modelId } from '~/api-docs/keys'
import type { ExampleSpec } from '~/api-docs/types'
import type { JsonToken } from '~/utils/jsonExample'

/**
 * An example: the full request address, then the response as highlighted JSON. Dark in both themes, like the site's
 * code blocks; data-theme="dark" lets the buttons inside take their dark look. Lines wrap under their own indent
 * instead of scrolling sideways. The copy buttons copy the address and the JSON without the "…" markers.
 *
 * The JSON is one HTML string (every text escaped below): the page has about a thousand example lines, too many to
 * keep as components. Colours are in api-docs.css.
 */
const props = defineProps<{ example: ExampleSpec }>()

const docs = useApiDocs()
const { showToast } = useToast()
const labels = computed(() => docs.value.texts.labels)
const url = computed(() => `${docs.value.base}${props.example.request}`)

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const CLASSES: Partial<Record<JsonToken['type'], string>> = { key: 'k', string: 's', number: 'n', literal: 'l' }

function token(part: JsonToken) {
  if (part.type === 'more') {
    const more = part.more
    if (typeof more === 'number') return `<span class="m">… ${escape(labels.value.more_items.replace('{n}', String(more)))}</span>`
    if (typeof more === 'string') {
      const [before = '', after = ''] = labels.value.more_model.split('{model}')
      return `<span class="m">… ${escape(before)}<a href="#${modelId(more)}">${escape(more)}</a>${escape(after)}</span>`
    }
    return '<span class="m">…</span>'
  }
  const type = CLASSES[part.type]
  return type ? `<span class="${type}">${escape(part.text)}</span>` : escape(part.text)
}

const html = computed(() => jsonExampleLines(props.example.body)
  .map(line => `<div class="ln" style="--d:${line.depth}">${line.tokens.map(token).join('')}</div>`)
  .join(''))

const copied = ref<'url' | 'json' | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy(kind: 'url' | 'json') {
  try {
    await navigator.clipboard.writeText(kind === 'url' ? url.value : jsonExampleText(props.example.body))
    copied.value = kind
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, 1500)
  }
  catch {
    showToast(labels.value.copy_failed, 'error')
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="overflow-hidden rounded-lg bg-codeblock" data-theme="dark">
    <figcaption class="flex items-center gap-2 border-b border-line py-1.5 pl-4 pr-1.5">
      <span class="ad-get font-mono text-xs font-semibold">GET</span>
      <code class="min-w-0 flex-1 font-mono text-xs leading-5 break-all text-body">{{ url }}</code>
      <UiButton
        :icon="copied === 'url' ? 'lucide:check' : 'lucide:link'"
        :label="copied === 'url' ? labels.copied : labels.copy_url"
        size="xs"
        variant="ghost"
        @click="copy('url')"
      />
      <UiButton
        :icon="copied === 'json' ? 'lucide:check' : 'lucide:copy'"
        :label="copied === 'json' ? labels.copied : labels.copy_json"
        size="xs"
        variant="ghost"
        @click="copy('json')"
      />
    </figcaption>
    <!-- eslint-disable-next-line vue/no-v-html -- built from the reference's own examples, every text escaped -->
    <div class="ad-json" v-html="html" />
  </figure>
</template>
