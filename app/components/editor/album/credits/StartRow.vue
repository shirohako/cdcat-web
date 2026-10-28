<script setup lang="ts">
/** The by-track view's "add a role" button, under a track's roles. */
const emit = defineEmits<{ start: [] }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-primary/45 bg-primary/8 px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
    @click="emit('start')"
  >
    <Icon name="lucide:plus" class="size-3.5" />{{ t('editor.credits.add_role') }}
  </button>
</template>
