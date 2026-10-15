<script setup lang="ts">
import type { AdminArticle } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin', validate: route => /^\d+$/.test(String(route.params.id)) })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const id = computed(() => String(route.params.id))
const { data, pending, error, refresh } = await useAsyncData(() => `admin-article-${id.value}`, () => $api<AdminArticle>(`/v1/admin/articles/${id.value}`), { watch: [id] })

const form = reactive({ title: '', slug: '', cover_url: '', status: 'draft', content: '', work_ids: '', reason: '' })
watch(data, (article) => {
  if (!article) return
  Object.assign(form, { title: article.title, slug: article.slug ?? '', cover_url: article.cover_url ?? '', status: article.status,
    content: article.content, work_ids: article.works.map(work => work.id).join(', '), reason: '' })
}, { immediate: true })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const save = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/articles/${id.value}`, { method: 'PUT', body: {
      title: form.title, slug: form.slug || null, cover_url: form.cover_url || null, status: form.status, content: form.content,
      work_ids: form.work_ids.split(/[,，\s]+/).filter(Boolean).map(Number), reason: form.reason || null,
    } })
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
const deleteOpen = ref(false)
const remove = async (reason: string) => {
  busy.value = true
  try {
    await $api(`/v1/admin/articles/${id.value}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await router.push('/admin/articles')
  } catch (e) {
    message.value = localizeError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => `${data.value?.title ?? t('admin_pages.articles.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/articles" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <header class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">{{ data.title }}</h1>
            <p class="mt-1 text-sm text-slate-500">{{ t('admin_pages.articles.author') }}：<NuxtLink v-if="data.author" :to="`/admin/users/${data.author.id}`" class="underline">{{ data.author.nickname || data.author.username }}</NuxtLink></p>
          </div>
          <NuxtLink v-if="data.status === 'published'" :to="`/articles/${data.id}`" target="_blank" class="text-sm underline">{{ t('admin_pages.preview_front') }}</NuxtLink>
        </header>
        <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
        <form class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2" @submit.prevent="save">
          <label class="block sm:col-span-2">{{ t('admin_pages.articles.article_title') }}<input v-model="form.title" required maxlength="255" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.status') }}<select v-model="form.status" :class="input"><option value="published">{{ t('admin_pages.user_detail.published') }}</option><option value="draft">{{ t('admin_pages.articles.draft_or_unpublished') }}</option></select></label>
          <label class="block">Slug<input v-model="form.slug" maxlength="255" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.cover') }}<input v-model="form.cover_url" type="url" maxlength="500" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.work_ids') }}<input v-model="form.work_ids" :class="input"><span class="mt-1 block text-xs text-slate-500">{{ data.works.map(work => `#${work.id} ${work.title}`).join('、') || '—' }}</span></label>
          <label class="block sm:col-span-2">{{ t('admin_pages.articles.content') }}<textarea v-model="form.content" required rows="18" :class="[input, 'font-mono text-xs']" /></label>
          <label class="block sm:col-span-2">{{ t('admin_pages.optional_reason') }}<input v-model="form.reason" maxlength="2000" :class="input"></label>
          <div class="flex justify-between gap-3 sm:col-span-2">
            <button type="button" class="rounded-lg border border-red-300 px-4 py-2 text-red-700" @click="deleteOpen = true">{{ t('common.delete') }}</button>
            <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button>
          </div>
        </form>
      </template>
    </AdminListState>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.articles.delete_title')" :description="t('admin_pages.articles.delete_help')" @confirm="remove" />
  </div>
</template>
