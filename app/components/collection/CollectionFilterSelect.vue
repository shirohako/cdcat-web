<template>
  <!-- A filter chip that opens the site's own select list (UiSelect). -->
  <UiSelect :model-value="modelValue" :options="selectOptions" @update:model-value="pick">
    <template #trigger="{ attrs, toggle, setRef, open }">
      <div class="relative inline-flex h-8 shrink-0 items-center rounded-lg text-xs font-medium ring-1 ring-inset transition-colors duration-150" :class="modelValue ? activeClass : idleClass">
        <button
          :ref="setRef"
          type="button"
          v-bind="attrs"
          class="inline-flex h-full items-center gap-1.5 rounded-lg pl-3"
          :class="modelValue ? 'pr-1' : 'pr-2.5'"
          :aria-label="label"
          @click="toggle"
        >
          <Icon :name="icon" class="h-3.5 w-3.5 shrink-0" />
          <span class="max-w-40 truncate">{{ selectedLabel ?? label }}</span>
          <Icon v-if="!modelValue" name="lucide:chevron-down" class="h-3 w-3 opacity-60 transition-transform duration-200 ease-out motion-reduce:transition-none" :class="{ 'rotate-180': open }" />
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="relative inline-flex h-full items-center pl-0.5 pr-2 opacity-80 hover:opacity-100"
          :aria-label="clearLabel"
          @click="emit('update:modelValue', null)"
        >
          <Icon name="lucide:x" class="h-3.5 w-3.5" />
        </button>
      </div>
    </template>
  </UiSelect>
</template>

<script setup lang="ts">
import type { UiSelectOption } from '~/components/ui/Select.vue'

/** One filter of a list page's filter bar, as a chip; `activeClass` / `idleClass` match the bar's other chips. */
const props = defineProps<{
  modelValue: string | null
  label: string
  icon: string
  options: Array<{ value: string, label: string }>
  allLabel: string
  clearLabel: string
  activeClass: string
  idleClass: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const selectOptions = computed<UiSelectOption<string | null>[]>(() => [{ value: null, label: props.allLabel }, ...props.options])
const selectedLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label ?? null)

const pick = (value: string | null | undefined) => emit('update:modelValue', value || null)
</script>
