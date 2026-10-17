<script setup lang="ts">
definePageMeta({ layout: 'writer', middleware: 'auth' })

const { t } = useI18n()
useHead({ title: computed(() => t('article_ui.writer.new_title')) })
</script>

<template>
  <ArticleWriter :article-id="null" />
</template>
