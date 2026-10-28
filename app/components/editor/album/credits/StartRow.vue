<script setup lang="ts">
/** The by-track view's "add a role" button, under a track's roles. */
const emit = defineEmits<{ start: [] }>()
const { t } = useI18n()
</script>

<template>
  <UiButton variant="add" size="xs" icon="lucide:plus" class="gap-1" @click="emit('start')">{{ t('editor.credits.add_role') }}</UiButton>
</template>
