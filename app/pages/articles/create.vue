<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <div class="mx-auto flex h-full w-full max-w-6xl 2xl:max-w-7xl flex-col">

      <ArticleEditorHeader
        v-model:title="form.title"
        v-model:settings-open="settingsOpen"
        back-to="/articles"
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
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

useHead({ title: '新建文章 | CDCAT' })

const router = useRouter()
const { $api } = useNuxtApp()

const form = reactive({
  title:   '',
  content: '',
})

const settings = ref({
  status:    'draft',
  cover_url: '',
  slug:      '',
})

const settingsOpen = ref(false)
const saving       = ref(false)
const saveStatus   = ref(null)

async function save() {
  saving.value = true
  saveStatus.value = null
  try {
    await $api('/v1/articles', {
      method: 'POST',
      body: {
        title:     form.title,
        content:   form.content,
        status:    settings.value.status,
        cover_url: settings.value.cover_url || null,
        slug:      settings.value.slug      || null,
      },
    })
    await router.replace('/articles')
  } catch {
    saveStatus.value = 'error'
    saving.value = false
  }
}
</script>
