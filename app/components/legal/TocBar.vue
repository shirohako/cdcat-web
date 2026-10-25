<script setup lang="ts">
import type { VNode } from 'vue'
import { sectionNumber, sectionShift, type LegalSection } from '~/legal'

/**
 * The table of contents below lg: a card that sticks under the navbar, naming the section you're in beside its number
 * badge, with how far through the whole text you are as a thin line along its bottom edge, both in the section's
 * colour. Tapping it opens the full list in a UiPopover (which handles focus, Escape and outside taps), scrolled to
 * the current section; picking a section closes it.
 */
const props = defineProps<{ sections: LegalSection[], active: number, progress: number }>()
const emit = defineEmits<{ navigate: [id: string] }>()
const { t } = useI18n()

const current = computed(() => props.sections[props.active])

function pick(event: MouseEvent, id: string, close: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  close()
  emit('navigate', id)
}

/** The list opens on the current section, not at the top. */
function revealCurrent({ el }: VNode) {
  const list = el as HTMLElement
  const item = list.querySelector<HTMLElement>('[aria-current]')
  if (item) list.scrollTop = item.offsetTop - list.clientHeight / 3
}
</script>

<template>
  <!-- The strip around the card hides the cards scrolling past behind it. -->
  <div class="sticky top-16 z-20 -mx-4 bg-page/90 px-4 py-2 backdrop-blur-md md:-mx-8 md:px-8">
    <UiPopover placement="bottom-start" :label="t('legal.toc')" class="w-[calc(100vw-2rem)] max-w-md p-2!">
      <template #trigger="{ open, toggle, attrs }">
        <button
          type="button"
          class="accent relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-lg bg-card pl-2 pr-3 text-left text-sm transition-colors duration-150 ease-out hover:bg-card-hover"
          :style="{ '--shift': sectionShift(active) }"
          v-bind="attrs"
          @click="toggle"
        >
          <span class="grid size-7 shrink-0 place-items-center rounded-md bg-(--accent-soft) font-mono text-xs font-semibold tabular-nums text-(--accent)">
            {{ sectionNumber(active) }}
          </span>
          <span class="min-w-0 flex-1 truncate font-medium text-title">{{ current?.short ?? current?.title }}</span>
          <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-meta transition-transform duration-200 ease-out" :class="{ 'rotate-180': open }" />
          <span
            class="progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--accent)"
            :style="{ transform: `scaleX(${progress})` }"
            aria-hidden="true"
          />
        </button>
      </template>
      <template #default="{ close }">
        <p class="mx-1 flex items-center gap-2 border-b border-line px-2 pb-2.5 pt-1.5 text-sm font-semibold text-title">
          <Icon name="lucide:list-tree" class="size-4 text-meta" />
          {{ t('legal.toc') }}
        </p>
        <ol class="relative mt-1.5 max-h-[60vh] space-y-px overflow-y-auto overscroll-contain" @vue:mounted="revealCurrent">
          <li v-for="(section, index) in sections" :key="section.id" class="accent" :style="{ '--shift': sectionShift(index) }">
            <a
              :href="`#${section.id}`"
              class="flex gap-3 rounded-md px-3 py-2 text-sm leading-5 transition-colors duration-150 ease-out"
              :class="index === active ? 'bg-(--accent-soft) font-medium text-title' : 'text-body hover:bg-(--ghost-hover)'"
              :aria-current="index === active ? 'location' : undefined"
              @click="pick($event, section.id, close)"
            >
              <span
                class="mt-px w-5 shrink-0 font-mono text-xs tabular-nums"
                :class="index === active ? 'font-semibold text-(--accent)' : 'text-faint'"
              >{{ sectionNumber(index) }}</span>
              <span class="min-w-0">{{ section.short ?? section.title }}</span>
            </a>
          </li>
        </ol>
      </template>
    </UiPopover>
  </div>
</template>

<style scoped>
.progress {
  transition: background-color 300ms ease-out;
}
</style>
