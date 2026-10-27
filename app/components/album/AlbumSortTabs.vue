<script setup lang="ts">
interface SortItem { value: string, label: string, icon: string }

/**
 * The album list's sort, in the header's #tabs, so it is the first thing under the title. On phones it is a
 * full-width UiSegmented (its thumb glides and squashes). On wider screens it is a row of tabs on the header's
 * line: each label carries its icon in a small tile, filled with the theme colour on the chosen tab, and one
 * underline glides to whichever tab is chosen. Pointing at a tab darkens its label, tips its icon and draws a faint
 * underline out from the middle.
 *
 * The underline is placed from measured offsets, so until mounting the chosen tab draws its own: the server-rendered
 * page already shows the choice, and nothing moves when the gliding one takes over.
 */
const props = defineProps<{
  items: SortItem[]
  modelValue: string
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabs = useTemplateRef<HTMLElement>('tabs')
const measured = ref(false)
const bar = reactive({ left: 0, width: 0 })

const measure = () => {
  const tab = tabs.value?.querySelector<HTMLElement>(`[data-value="${props.modelValue}"]`)
  if (!tab) return
  bar.left = tab.offsetLeft
  bar.width = tab.offsetWidth
  measured.value = true
}

let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (tabs.value) observer.observe(tabs.value)
  void document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => observer?.disconnect())
// 最相关 comes and goes with a search, which shifts the tabs too.
watch(() => [props.modelValue, props.items.length], () => nextTick(measure))
</script>

<template>
  <div class="px-4 pb-3 sm:hidden">
    <UiSegmented
      :model-value="modelValue"
      :items="items"
      block
      :label="label"
      @update:model-value="value => value && emit('update:modelValue', String(value))"
    />
  </div>

  <div ref="tabs" role="group" :aria-label="label" class="relative hidden gap-7 px-6 sm:flex">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :data-value="item.value"
      class="group/tab relative flex items-center gap-2 pb-3 pt-0.5 text-[15px] transition-colors duration-200 ease-out"
      :class="item.value === modelValue ? 'font-semibold text-title' : 'font-medium text-meta hover:text-title'"
      :aria-pressed="item.value === modelValue"
      @click="emit('update:modelValue', item.value)"
    >
      <span
        class="grid size-7 place-items-center rounded-md transition-[background-color,color,rotate,translate,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
        :class="item.value === modelValue
          ? 'bg-primary text-on-primary group-hover/tab:-rotate-6 group-hover/tab:scale-105'
          : 'bg-black/5 group-hover/tab:-translate-y-0.5 group-hover/tab:-rotate-8 group-hover/tab:bg-black/10 dark:bg-white/[0.07] dark:group-hover/tab:bg-white/[0.12]'"
        aria-hidden="true"
      >
        <Icon :name="item.icon" class="size-4" />
      </span>
      {{ item.label }}
      <!-- A faint underline drawn out from the middle while pointed at; before mounting, the chosen tab's own. -->
      <span
        class="absolute inset-x-0 bottom-0 h-0.5 origin-center rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        :class="item.value === modelValue
          ? (measured ? 'scale-x-0' : 'bg-primary')
          : 'scale-x-0 bg-line group-hover/tab:scale-x-100'"
        aria-hidden="true"
      />
    </button>
    <!-- The chosen tab's underline, gliding from tab to tab -->
    <span
      v-if="measured"
      class="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-primary transition-[translate,width] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
      :style="{ translate: `${bar.left}px 0`, width: `${bar.width}px` }"
      aria-hidden="true"
    />
  </div>
</template>
