<script setup lang="ts">
import { sectionNumber, sectionShift, type DocSectionLink } from '~/documents/sections'

/**
 * The desktop table of contents, a numbered list on a card beside the text. A soft block in the current section's
 * colour sits behind the section you're in and glides to the next one, taking on its colour as it goes. It is placed
 * from the items' measured offsets, re-measured whenever the list changes size (titles wrap differently per language
 * and width). The parent makes the card sticky and reports `active`.
 */
const props = defineProps<{ sections: DocSectionLink[], active: number, label: string }>()
const emit = defineEmits<{ navigate: [id: string] }>()

const scroller = useTemplateRef<HTMLElement>('scroller')
const list = useTemplateRef<HTMLOListElement>('list')
const offsets = ref<Array<{ top: number, height: number }>>([])

function measure() {
  // In DOM order: a v-for ref array doesn't promise the source order.
  offsets.value = [...(list.value?.querySelectorAll<HTMLElement>(':scope > li') ?? [])].map(item => ({ top: item.offsetTop, height: item.offsetHeight }))
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (list.value) resizeObserver.observe(list.value)
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch(() => props.sections, () => nextTick(measure))

const current = computed(() => offsets.value[props.active])

// Keep the current entry in view when the list is taller than the screen.
watch(() => props.active, (index) => {
  const item = list.value?.querySelectorAll<HTMLElement>(':scope > li')[index]
  const box = scroller.value
  if (!item || !box || box.scrollHeight <= box.clientHeight) return
  if (item.offsetTop < box.scrollTop || item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight) {
    box.scrollTo({ top: item.offsetTop - box.clientHeight / 3, behavior: 'smooth' })
  }
})

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
          :style="{ transform: `translateY(${current.top}px)`, height: `${current.height}px`, '--shift': sectionShift(active) }"
          aria-hidden="true"
        />

        <li v-for="(section, index) in sections" :key="section.id" class="accent" :style="{ '--shift': sectionShift(index) }">
          <!-- Until the block has been placed, the current entry paints its own background, as on the server. -->
          <a
            :href="`#${section.id}`"
            class="group flex gap-3 rounded-md px-3 py-2 text-sm leading-5 transition-colors duration-150 ease-out"
            :class="index === active
              ? ['font-medium text-title', { 'bg-(--accent-soft)': !current }]
              : 'text-meta hover:bg-card-hover hover:text-title'"
            :aria-current="index === active ? 'location' : undefined"
            @click="pick($event, section.id)"
          >
            <span
              class="mt-px w-5 shrink-0 font-mono text-xs tabular-nums transition-colors duration-150 ease-out"
              :class="index === active ? 'font-semibold text-(--accent)' : 'text-faint group-hover:text-(--accent)'"
            >{{ sectionNumber(index) }}</span>
            <span class="line-clamp-2 min-w-0">{{ section.short ?? section.title }}</span>
          </a>
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

@media (prefers-reduced-motion: reduce) {
  .block-on {
    transition: none;
  }
}
</style>
