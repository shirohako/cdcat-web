<template>
  <ul v-if="errors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
    <li v-for="error in errors" :key="error.path"><span v-if="where(error.path)" class="font-medium">{{ where(error.path) }}: </span>{{ error.message }}</li>
  </ul>
</template>

<script setup lang="ts">
/** Server errors under items.album.<collection>, e.g. "tracks.t1.title"; rows also mark themselves. */
const props = defineProps<{ collection: string }>()
const editor = useAlbumEditor()
const { fieldLabel } = useDocumentSchema('album')

const errors = computed(() => editor.errorsIn(props.collection))
const where = (path: string) => {
  const rest = path.split('.').slice(3)
  return rest.length > 1 ? fieldLabel(rest.at(-1)!) : ''
}
</script>
