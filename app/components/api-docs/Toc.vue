<script setup lang="ts">
import { endpointId, modelId } from '~/api-docs/keys'
import type { ApiDocsSection } from '~/api-docs/types'
import { sectionNumber, sectionShift } from '~/documents/sections'

/**
 * The desktop table of contents, like the guides' (DocToc): numbered sections with a soft block in the current
 * section's colour that glides between them. The current section also unfolds its endpoints (method and path, the
 * same in every language) and objects, the one being read marked in the section's colour.
 */
const props = defineProps<{ sections: ApiDocsSection[], activeSection: number, activeItem: string | null, label: string }>()
const emit = defineEmits<{ navigate: [id: string] }>()

const scroller = useTemplateRef<HTMLElement>('scroller')
const list = useTemplateRef<HTMLOListElement>('list')
const offsets = ref<Array<{ top: number, height: number }>>([])

const children = (section: ApiDocsSection) => section.items.flatMap(item => item.kind === 'endpoint'
  ? [{ id: endpointId(item), method: item.method as string | null, label: item.path }]
  : item.kind === 'model' ? [{ id: modelId(item.name), method: null, label: item.name }] : [])

function measure() {
  offsets.value = [...(list.value?.querySelectorAll<HTMLElement>(':scope > li > a') ?? [])].map(link => ({ top: link.offsetTop, height: link.offsetHeight }))
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (list.value) resizeObserver.observe(list.value)
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch(() => [props.sections, props.activeSection], () => nextTick(measure))

const current = computed(() => offsets.value[props.activeSection])

// Keep what is being read in view when the list is taller than the screen.
watch(() => props.activeItem ?? props.activeSection, () => nextTick(() => {
  const item = list.value?.querySelector<HTMLElement>('[aria-current]')
  const box = scroller.value
  if (!item || !box || box.scrollHeight <= box.clientHeight) return
  const top = item.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
  if (top < box.scrollTop || top + item.offsetHeight > box.scrollTop + box.clientHeight) {
    box.scrollTo({ top: top - box.clientHeight / 3, behavior: 'smooth' })
  }
}))

function pick(event: MouseEvent, id: string) {
  // Let modified clicks open the link the browser's way.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  emit('navigate', id)
}
</script>

<template>
  <nav :aria-label="label" class="flex min-h-0 flex-col">
    <p class="mx-1 flex items-center gap-2 border-b border-line px-2 pb-3 pt-2 text-sm font-semibold text-title">
      <Icon name="lucide:list-tree" class="size-4 text-meta" />
      {{ label }}
    </p>

    <div ref="scroller" class="toc-scroller mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <ol ref="list" class="relative isolate space-y-px">
        <span
          v-if="current"
          class="block-on accent absolute inset-x-0 top-0 -z-10 rounded-md bg-(--accent-soft)"
          :style="{ transform: `translateY(${current.top}px)`, height: `${current.height}px`, '--shift': sectionShift(activeSection) }"
          aria-hidden="true"
        />

        <li v-for="(section, index) in sections" :key="section.id" class="accent" :style="{ '--shift': sectionShift(index) }">
          <a
            :href="`#${section.id}`"
            class="group flex gap-3 rounded-md px-3 py-2 text-sm leading-5 transition-colors duration-150 ease-out"
            :class="index === activeSection
              ? ['font-medium text-title', { 'bg-(--accent-soft)': !current }]
              : 'text-meta hover:bg-card-hover hover:text-title'"
            :aria-current="index === activeSection && !activeItem ? 'location' : undefined"
            @click="pick($event, section.id)"
          >
            <span
              class="mt-px w-5 shrink-0 font-mono text-xs tabular-nums transition-colors duration-150 ease-out"
              :class="index === activeSection ? 'font-semibold text-(--accent)' : 'text-faint group-hover:text-(--accent)'"
            >{{ sectionNumber(index) }}</span>
            <span class="line-clamp-2 min-w-0">{{ section.short ?? section.title }}</span>
          </a>

          <ul v-if="index === activeSection && children(section).length" class="mb-1.5 ml-[1.375rem] mt-0.5 border-l border-line">
            <li v-for="child in children(section)" :key="child.id">
              <a
                :href="`#${child.id}`"
                class="relative flex min-w-0 items-baseline gap-1.5 py-1 pl-3 pr-2 font-mono text-xs transition-colors duration-150 ease-out"
                :class="child.id === activeItem ? 'is-current text-title' : 'text-meta hover:text-title'"
                :aria-current="child.id === activeItem ? 'location' : undefined"
                @click="pick($event, child.id)"
              >
                <span v-if="child.method" class="shrink-0 text-[9.5px] text-faint">{{ child.method }}</span>
                <span class="min-w-0 break-all">{{ child.label }}</span>
              </a>
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </nav>
</template>

<style scoped>
.block-on {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 320ms ease-out;
}

.toc-scroller {
  scrollbar-width: thin;
}

.is-current::before {
  content: "";
  position: absolute;
  top: 0.3rem;
  bottom: 0.3rem;
  left: -1px;
  width: 2px;
  border-radius: 2px;
  background: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .block-on {
    transition: none;
  }
}
</style>
