<script setup lang="ts">
/** The spinning ring shown while something loads. With a `label` it is announced; without one it is decoration. */
withDefaults(defineProps<{ size?: 'xs' | 'sm' | 'md' | 'lg', label?: string }>(), { size: 'sm', label: undefined })

const SIZES = { xs: 'loading-xs', sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' }
</script>

<template>
  <span
    class="loading loading-spinner"
    :class="SIZES[size]"
    :role="label ? 'status' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>
