<template>
  <UiDialog v-model="open" :title="t('editor.credits.hint_title')" :icon="Lightbulb" size="lg" dark>
    <template #actions>
      <UiSegmented v-model="page" :items="pages" :label="t('editor.credits.hint_title')" semantics="tab" size="sm" />
    </template>
    <div ref="top" class="text-xs leading-5 text-title">
      <EditorAlbumCreditsBylineGuide v-if="page === 'byline'" />
      <EditorAlbumCreditsExamples v-else />
    </div>
    <!-- Stays in view instead of the dialog's footer band; the text fades out just above it as it scrolls by. -->
    <div class="sticky bottom-0 -mx-5 -mb-5 mt-3 flex justify-end bg-card px-5 pb-3 pt-1.5">
      <div class="pointer-events-none absolute inset-x-0 bottom-full h-3 bg-linear-to-t from-card to-transparent" />
      <UiButton v-if="page === 'byline'" variant="primary" size="sm" data-autofocus @click="page = 'contributors'">{{ t('common.next') }}</UiButton>
      <UiButton v-else variant="primary" size="sm" data-autofocus @click="open = false">{{ t('common.got_it') }}</UiButton>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { Lightbulb } from '@lucide/vue'

/** How to fill in 参与创作的人: the byline on one page, the other credits on the next. Always opens on the first. */
const open = defineModel<boolean>({ required: true })

const { t } = useI18n()

const page = ref<'byline' | 'contributors'>('byline')
const pages = computed(() => [
  { value: 'byline' as const, label: t('editor.credits.byline_title') },
  { value: 'contributors' as const, label: t('editor.credits.contributors') },
])

const top = useTemplateRef<HTMLElement>('top')
watch(page, () => top.value?.scrollIntoView({ block: 'start' }), { flush: 'post' })
watch(open, (value) => {
  if (value) page.value = 'byline'
})
</script>
