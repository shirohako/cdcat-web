<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { endpointId, statusKey } from '~/api-docs/keys'
import type { EndpointSpec } from '~/api-docs/types'

/**
 * One endpoint inside its section: the method and path (with a button that copies a link here), its title and what
 * it does, the parameters, what `data` holds, the answers worth knowing, notes, and an example. `flash` lights the
 * method badge up after a jump from the table of contents.
 */
const props = defineProps<{ endpoint: EndpointSpec, flash: boolean }>()

const docs = useApiDocs()
const { showToast } = useToast()
const { t } = useI18n()
const id = computed(() => endpointId(props.endpoint))
const text = computed(() => docs.value.texts.endpoints[id.value] ?? { title: '', summary: '' })
const labels = computed(() => docs.value.texts.labels)
const responseModel = computed(() => labels.value.response_model.split('{model}'))
const statuses = computed(() => (props.endpoint.statuses ?? []).map(status => ({
  ...status,
  text: text.value.statuses?.[statusKey(status)] ?? docs.value.texts.statuses[statusKey(status)] ?? '',
})))

async function copyLink() {
  const url = `${window.location.origin}${window.location.pathname}#${id.value}`
  try {
    await navigator.clipboard.writeText(url)
    showToast(t('legal.link_copied'))
  }
  catch {
    showToast(t('legal.copy_failed', { url }), 'error')
  }
}
</script>

<template>
  <article :id="id" class="group/endpoint scroll-mt-36 border-t border-line pt-6 lg:scroll-mt-20">
    <header class="flex items-center gap-2.5">
      <span class="method rounded-sm bg-primary px-1.5 py-1 font-mono text-[11px] font-semibold leading-none tracking-wide text-on-primary" :class="{ 'is-flashing': flash }">{{ endpoint.method }}</span>
      <ApiDocsPath :path="endpoint.path" class="min-w-0 text-[17px] font-medium" />
      <UiButton
        icon="lucide:link"
        :label="t('legal.copy_link')"
        size="sm"
        class="ml-auto shrink-0 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover/endpoint:opacity-100 lg:focus-visible:opacity-100"
        @click="copyLink"
      />
    </header>
    <h3 class="mt-2.5 text-lg font-bold text-title">{{ text.title }}</h3>
    <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
    <p class="mt-1.5 text-[15px] leading-7 text-body" v-html="docs.inline(text.summary)" />

    <ApiDocsParams v-if="endpoint.pathParams" :params="endpoint.pathParams" :label="labels.path_params" :texts="text.params" />
    <ApiDocsParams v-if="endpoint.query" :params="endpoint.query" :label="labels.query_params" :texts="text.params" />

    <section class="mt-6">
      <h4 class="text-[13px] font-semibold text-meta">{{ labels.response }}</h4>
      <p v-if="endpoint.response.model" class="mt-2 text-sm leading-6 text-body">
        {{ responseModel[0] }}<ApiDocsType :type="endpoint.response.model" />{{ responseModel[1] }}
      </p>
      <ApiDocsFields v-else-if="endpoint.response.fields" :fields="endpoint.response.fields" :texts="text.fields" class="mt-2" />
    </section>

    <section v-if="statuses.length" class="mt-6">
      <h4 class="text-[13px] font-semibold text-meta">{{ labels.statuses }}</h4>
      <ul class="mt-2 grid gap-1.5">
        <li v-for="status in statuses" :key="status.status + (status.name ?? '')" class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm leading-6">
          <span class="rounded-sm px-1.5 font-mono text-xs font-semibold" :class="status.status >= 400 ? 'status-bad' : 'status-ok'">{{ status.status }}</span>
          <code v-if="status.name" class="font-mono text-[12.5px] text-title">{{ status.name }}</code>
          <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
          <span class="min-w-0 text-body" v-html="docs.inline(status.text)" />
        </li>
      </ul>
    </section>

    <DocProse v-if="text.notes" :content="docs.fill(text.notes)" class="mt-6" />

    <section class="mt-6">
      <h4 class="text-[13px] font-semibold text-meta">{{ labels.example }}</h4>
      <ApiDocsCode :example="endpoint.example" class="mt-2" />
    </section>
  </article>
</template>

<style scoped>
.status-ok {
  background: color-mix(in oklab, var(--success) 15%, transparent);
  color: var(--success);
}

.status-bad {
  background: color-mix(in oklab, var(--danger) 13%, transparent);
  color: var(--danger);
}

.method.is-flashing {
  animation: flash 900ms ease-out;
}

@keyframes flash {
  20% {
    background-color: var(--accent);
    scale: 1.12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .method.is-flashing {
    animation: none;
  }
}
</style>
