<template>
  <div class="min-h-[calc(100vh-3.5rem)]">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-6">
      <MarkdownGuide brand="CDCat" image-src="/icon.png" image-alt="CDCat" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** The site's own Markdown guide; the editor's help banner links here. */
const { t } = useI18n()
usePageSeo({
  title: () => t('markdown.help.title'),
  description: () => t('markdown.help.lead'),
})
</script>
