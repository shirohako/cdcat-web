<script setup lang="ts">
/**
 * A block of the guide's relation map: a link to the section about it, in that section's colour (`shift`), with an
 * icon, the name and a line on what it is. `central` is the album's larger block. Reports hovering and focus so the
 * map can light the connections.
 */
defineProps<{ id: string, icon: string, name: string, desc: string, shift: number, central?: boolean }>()
const emit = defineEmits<{ hover: [id: string] }>()
</script>

<template>
  <div
    class="accent flex flex-col rounded-lg bg-card shadow-xs ring-1 ring-line transition duration-150 ease-out hover:ring-(--accent)/60"
    :class="central ? 'justify-center p-3.5' : 'p-2.5'"
    :style="{ '--shift': shift }"
    @mouseenter="emit('hover', id)"
    @focusin="emit('hover', id)"
  >
    <a :href="`#${id}`" class="group flex items-start gap-2.5">
      <span
        class="grid shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent) transition-colors duration-150 ease-out group-hover:bg-(--accent) group-hover:text-(--on-accent)"
        :class="central ? 'size-9' : 'size-7'"
      >
        <Icon :name="icon" :class="central ? 'size-5' : 'size-4'" />
      </span>
      <span class="min-w-0">
        <span class="block font-semibold text-title" :class="central ? 'text-[15px]' : 'text-[13px]'">{{ name }}</span>
        <span class="mt-0.5 block text-[11px] leading-4 text-meta">{{ desc }}</span>
      </span>
    </a>
    <slot />
  </div>
</template>
