<script setup lang="ts">
definePageMeta({
  layout: 'writer',
  middleware: 'auth',
  validate: route => /^\d+$/.test(String(route.params.id)),
})

const route = useRoute()
const { t } = useI18n()
const articleId = Number(route.params.id)
useHead({ title: computed(() => t('article_ui.writer.edit_title')) })
</script>

<template>
  <ArticleWriter :article-id="articleId" />
</template>
