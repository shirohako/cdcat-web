<template>
  <UiDialog v-model="open" :title="t('editor.credits.hint_title')" :icon="Lightbulb" size="lg" dark plain-footer>
    <template #actions>
      <UiSegmented v-model="page" :items="pages" :label="t('editor.credits.hint_title')" semantics="tab" size="sm" />
    </template>
    <template #toolbar>
      <h3 class="text-xl font-bold leading-7 text-title">{{ pageTitle }}</h3>
    </template>
    <div ref="top" class="text-xs leading-5 text-title">
      <EditorAlbumCreditsBylineGuide v-if="page === 'byline'" />
      <EditorAlbumCreditsExamples v-else />
    </div>
    <template #footer>
      <UiButton v-if="page === 'byline'" variant="primary" size="sm" data-autofocus @click="page = 'contributors'">{{ t('common.next') }}</UiButton>
      <UiButton v-else variant="primary" size="sm" data-autofocus @click="open = false">{{ t('common.got_it') }}</UiButton>
    </template>
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
const pageTitle = computed(() => page.value === 'byline' ? t('editor.credits.byline_title') : t('editor.album.section.credits'))

const top = useTemplateRef<HTMLElement>('top')
watch(page, () => top.value?.scrollIntoView({ block: 'start' }), { flush: 'post' })
watch(open, (value) => {
  if (value) page.value = 'byline'
})
</script>
