<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { endpointId, modelId } from '~/api-docs/keys'
import { API_DOCS_STRUCTURE } from '~/api-docs/structure'
import type { ApiDocsSection, EnumSpec, ItemSpec } from '~/api-docs/types'
import { sectionNumber, sectionShift } from '~/documents/sections'

/**
 * One numbered section of the API reference, on its own card like the guides': badge, heading, a button that copies
 * a link to it, and the lead. A section with endpoints or objects lists them first, then shows its items in order;
 * neighbouring enums share a grid. `flashId` names the anchor the table of contents just jumped to.
 */
const props = defineProps<{ section: ApiDocsSection, flashId: string | null }>()

const docs = useApiDocs()
const { showToast } = useToast()
const { t } = useI18n()

type Block = { item: Exclude<ItemSpec, EnumSpec> } | { enums: EnumSpec[] }
const blocks = computed(() => props.section.items.reduce<Block[]>((list, item) => {
  const last = list.at(-1)
  if (item.kind !== 'enum') list.push({ item })
  else if (last && 'enums' in last) last.enums.push(item)
  else list.push({ enums: [item] })
  return list
}, []))

type IndexEntry = { id: string, method: string | null, path: string, title: string }
const index = computed(() => props.section.items.flatMap<IndexEntry>(item => item.kind === 'endpoint'
  ? [{ id: endpointId(item), method: item.method, path: item.path, title: docs.value.texts.endpoints[endpointId(item)]?.title ?? '' }]
  : item.kind === 'model' ? [{ id: modelId(item.name), method: null, path: item.name, title: docs.value.texts.models[item.name]?.title ?? '' }] : []))

const changes = computed(() => API_DOCS_STRUCTURE.changes.map(change => ({ ...change, text: docs.value.texts.changes[change.id] ?? '' })))

async function copyLink() {
  const url = `${window.location.origin}${window.location.pathname}#${props.section.id}`
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
  <!-- Below lg the sticky contents bar (60px) sits under the navbar, so sections stop lower there. -->
  <section
    :id="section.id"
    class="group/section accent scroll-mt-36 rounded-lg bg-card p-5 md:p-7 lg:scroll-mt-20"
    :style="{ '--shift': sectionShift(section.index) }"
  >
    <header class="flex items-start gap-3">
      <span
        class="badge grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) font-mono text-sm font-semibold tabular-nums text-(--accent)"
        :class="{ 'is-flashing': flashId === section.id }"
        aria-hidden="true"
      >
        {{ sectionNumber(section.index) }}
      </span>
      <h2 class="min-w-0 flex-1 pt-1 text-xl font-bold leading-7 text-title md:text-[22px]">{{ section.title }}</h2>
      <UiButton
        icon="lucide:link"
        :label="t('legal.copy_link')"
        size="sm"
        class="shrink-0 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover/section:opacity-100 lg:focus-visible:opacity-100"
        @click="copyLink"
      />
    </header>

    <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
    <p class="mt-3 text-[15px] leading-7 text-body md:pl-12" v-html="docs.inline(section.lead)" />

    <div class="md:pl-12">
      <nav v-if="index.length > 1" :aria-label="docs.texts.labels.in_section" class="mt-5 grid gap-0.5 rounded-md bg-sunken p-1.5 ring-1 ring-line">
        <a
          v-for="entry in index"
          :key="entry.id"
          :href="`#${entry.id}`"
          class="flex min-w-0 items-baseline gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors duration-150 ease-out hover:bg-card"
        >
          <span v-if="entry.method" class="w-8 shrink-0 font-mono text-[11px] font-semibold text-meta">{{ entry.method }}</span>
          <span v-else class="w-8 shrink-0 text-[11px] text-faint">{{ docs.texts.labels.model }}</span>
          <ApiDocsPath v-if="entry.method" :path="entry.path" class="min-w-0 shrink-0 text-[13px]" />
          <code v-else class="shrink-0 font-mono text-[13px] text-title">{{ entry.path }}</code>
          <span class="min-w-0 truncate text-meta">{{ entry.title }}</span>
        </a>
      </nav>

      <template v-for="(block, at) in blocks" :key="at">
        <div v-if="'enums' in block" class="mt-6 grid gap-3 xl:grid-cols-2">
          <ApiDocsEnum v-for="spec in block.enums" :key="spec.name" :spec="spec" />
        </div>
        <DocProse v-else-if="block.item.kind === 'prose'" :content="docs.fill(docs.texts.prose[block.item.id] ?? '')" class="mt-5" />
        <ApiDocsEndpoint v-else-if="block.item.kind === 'endpoint'" :endpoint="block.item" :flash="flashId === endpointId(block.item)" class="mt-8" />
        <ApiDocsModel v-else-if="block.item.kind === 'model'" :model="block.item" :flash="flashId === modelId(block.item.name)" class="mt-8" />
        <ol v-else-if="block.item.kind === 'changes'" class="mt-5 grid gap-3">
          <li v-for="change in changes" :key="change.id" class="grid gap-x-4 gap-y-1 border-t border-line pt-3 text-sm leading-6 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
            <time :datetime="change.date" class="font-mono text-[13px] text-meta">{{ change.date }}</time>
            <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
            <span class="text-body" v-html="docs.inline(change.text)" />
          </li>
        </ol>
      </template>
    </div>
  </section>
</template>

<style scoped>
.badge {
  transition: background-color 200ms ease-out, color 200ms ease-out;
}

.badge.is-flashing {
  animation: flash 900ms ease-out;
}

@keyframes flash {
  20% {
    background-color: var(--accent);
    color: var(--on-accent);
    scale: 1.12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge.is-flashing {
    animation: none;
  }
}
</style>
