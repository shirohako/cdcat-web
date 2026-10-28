<script setup lang="ts">
/**
 * An entry in the guide's series tree, with its kind and the album it brings into the series. `top` draws it right
 * under the series, with the branch line the sub-series rows have.
 */
defineProps<{ title: string, kind: string, icon: string, album: string, shift?: number, top?: boolean }>()
</script>

<template>
  <li class="relative">
    <span class="absolute top-3.5 border-t border-faint/60" :class="top ? '-left-4 w-3' : '-left-3 w-2'" />
    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-1 py-1" :class="{ 'bg-sunken px-2!': top }">
      <Icon :name="icon" class="size-3.5 shrink-0 text-meta" />
      <span class="min-w-0 truncate text-[11px] font-medium text-title">{{ title }}</span>
      <span class="text-[10px] text-meta">{{ kind }}</span>
      <span class="ml-auto inline-flex min-w-0 items-center gap-1.5 rounded-sm bg-card px-1.5 py-0.5 ring-1 ring-line">
        <Icon name="lucide:corner-down-right" class="size-3 shrink-0 text-faint" />
        <GuideFigureSampleCover class="size-4 shrink-0 rounded-[2px]" :style="{ '--shift': shift ?? 200 }" />
        <span class="truncate text-[10px] text-body">{{ album }}</span>
      </span>
    </p>
  </li>
</template>
