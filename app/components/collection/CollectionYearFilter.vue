<script setup lang="ts">
/**
 * A year filter for a list page's filter bar: a chip that opens the years from next year (pre-orders) back to `from`,
 * newest first under decade headings; nothing is fetched for it. Chosen, the chip shows the year in the bar's chosen
 * colour, with a ×; choosing the chosen year again clears it. The page passes the bar's chip classes.
 */
const props = withDefaults(defineProps<{
  modelValue: number | null
  label: string
  activeClass: string
  idleClass: string
  /** The earliest year offered */
  from?: number
}>(), { from: 1970 })

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t } = useI18n()
const open = ref(false)

const decades = computed(() => {
  const groups: { decade: number, years: number[] }[] = []
  for (let year = new Date().getFullYear() + 1; year >= props.from; year--) {
    const decade = Math.floor(year / 10) * 10
    if (groups.at(-1)?.decade !== decade) groups.push({ decade, years: [] })
    groups.at(-1)!.years.push(year)
  }
  return groups
})

const choose = (year: number | null, close?: () => void) => {
  close?.()
  emit('update:modelValue', year === props.modelValue ? null : year)
}
</script>

<template>
  <UiPopover v-model:open="open" placement="bottom-start" :label="label" class="w-72 p-2!">
    <template #trigger="{ toggle, attrs }">
      <div v-if="modelValue" class="inline-flex h-8 items-center rounded-lg text-xs font-medium ring-1 ring-inset" :class="activeClass">
        <button type="button" class="inline-flex h-full items-center gap-1.5 pl-3 pr-1.5 tabular-nums" v-bind="attrs" @click="toggle">
          <Icon name="lucide:calendar" class="h-3.5 w-3.5 shrink-0" />
          {{ modelValue }}
          <Icon name="lucide:chevron-down" class="h-3 w-3 shrink-0 opacity-70" />
        </button>
        <button type="button" class="inline-flex h-full items-center pl-0.5 pr-2 opacity-80 transition-opacity duration-150 ease-out hover:opacity-100" :aria-label="t('event_picker.clear')" @click="choose(null)">
          <Icon name="lucide:x" class="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        v-else
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
        :class="idleClass"
        v-bind="attrs"
        @click="toggle"
      >
        <Icon name="lucide:calendar" class="h-3.5 w-3.5" />
        {{ label }}
        <Icon name="lucide:chevron-down" class="h-3 w-3 opacity-60" />
      </button>
    </template>

    <template #default="{ close }">
      <section v-for="group in decades" :key="group.decade" class="not-first:mt-1.5">
        <h3 class="px-1.5 pb-1 pt-1 text-[11px] font-semibold tabular-nums text-faint">{{ t('year_filter.decade', { decade: group.decade }) }}</h3>
        <div class="grid grid-cols-5 gap-1">
          <button
            v-for="entry in group.years"
            :key="entry"
            type="button"
            class="h-8 rounded-md text-xs font-semibold tabular-nums transition-colors duration-150 ease-out"
            :class="entry === modelValue ? 'bg-primary text-on-primary' : 'text-body hover:bg-ghost-hover'"
            :aria-pressed="entry === modelValue"
            @click="choose(entry, close)"
          >
            {{ entry }}
          </button>
        </div>
      </section>
    </template>
  </UiPopover>
</template>
