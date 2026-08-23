<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">

    <ArticleEditorHeader
      :back-to="`/articles/${articleId}`"
      v-model:title="form.title"
      v-model:settings-open="settingsOpen"
      :status="settings.status"
      :saving="saving"
      :save-status="saveStatus"
      @save="save"
    />

    <div class="flex-1 flex min-h-0 p-4 gap-4">
      <div class="min-w-0 flex-1 overflow-y-auto">
        <MarkdownEditor
          v-model="form.content"
          :placeholder="$t('article_ui.start_writing')"
        />
      </div>
      <ArticleEditorSettings
        v-model:open="settingsOpen"
        v-model="settings"
      />
    </div>

  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const articleId = route.params.id
const { $api } = useNuxtApp()

const { data: response } = await useAPI(`/v1/articles/${articleId}`)
const article = computed(() => response.value ?? null)

useHead(() => ({
  title: article.value ? `编辑 · ${article.value.title} | CDCAT` : '编辑文章 | CDCAT',
}))

const form = reactive({
  title:   article.value?.title   ?? '',
  content: article.value?.content ?? '',
})

const settings = ref({
  status:    article.value?.status    ?? 'draft',
  cover_url: article.value?.cover_url ?? '',
  slug:      article.value?.slug      ?? '',
  work_ids:  article.value?.works?.map(w => w.id).join(',') ?? '',
})

const settingsOpen = ref(false)
const saving     = ref(false)
const saveStatus = ref(null)

async function save() {
  saving.value = true
  saveStatus.value = null
  try {
    await $api(`/v1/articles/${articleId}`, {
      method: 'PUT',
      body: {
        title:     form.title,
        content:   form.content,
        status:    settings.value.status,
        cover_url: settings.value.cover_url || null,
        slug:      settings.value.slug      || null,
      },
    })
    await $api(`/v1/articles/${articleId}/works`, {
      method: 'POST',
      body: { work_ids: settings.value.work_ids || '' },
    })
    window.location.href = `/articles/${articleId}`
  } catch {
    saveStatus.value = 'error'
    saving.value = false
  }
}
</script>
