<template>
  <div class="min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-6">
      <MarkdownGuide brand="CDCAT" image-src="/icon.png" image-alt="CDCAT" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** The site's own Markdown guide; the editor's help banner links here. */
const { t } = useI18n()
useSeoMeta({
  title: () => t('markdown.help.title'),
  description: () => t('markdown.help.lead'),
})
</script>
