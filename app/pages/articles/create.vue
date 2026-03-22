<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">

    <ArticleEditorHeader
      back-to="/articles"
      v-model:title="form.title"
      v-model:settings-open="settingsOpen"
      :status="settings.status"
      :saving="saving"
      :save-status="saveStatus"
      @save="save"
    />

    <!-- 移动端 Tab -->
    <div class="md:hidden shrink-0 flex border-b border-gray-200 bg-white">
      <button
        class="flex-1 py-2 text-sm font-medium transition-colors"
        :class="mobileTab === 'write' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'"
        @click="mobileTab = 'write'"
      >编写</button>
      <button
        class="flex-1 py-2 text-sm font-medium transition-colors"
        :class="mobileTab === 'preview' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'"
        @click="mobileTab = 'preview'"
      >预览</button>
    </div>

    <div class="flex-1 flex min-h-0 p-4 gap-4">
      <ArticleEditorPane
        v-model="form.content"
        :class="mobileTab === 'preview' ? 'hidden md:flex md:flex-1' : 'flex flex-1'"
      />
      <ArticleEditorPreview
        :title="form.title"
        :content="form.content"
        :class="mobileTab === 'write' ? 'hidden md:flex md:flex-1' : 'flex flex-1'"
      />
      <ArticleEditorSettings
        v-model:open="settingsOpen"
        v-model="settings"
      />
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
const mobileTab    = ref('write')
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
