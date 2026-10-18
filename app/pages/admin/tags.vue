<script setup lang="ts">
import type { AdminPagination, AdminTag } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError(t)
const search = ref('')
const appliedSearch = ref('')
const { data, pending, error, refresh } = await useAsyncData('admin-tags',
  () => $api<{ items: AdminTag[], pagination: AdminPagination }>('/v1/admin/tags', { query: { search: appliedSearch.value || undefined, per_page: 100 } }), { watch: [appliedSearch] })

const empty = () => ({ id: 0, name: '', slug: '', description: '', name_en: '', name_ja: '', is_staff_only: false })
const form = reactive(empty())
const busy = ref(false)
const message = ref('')
const notice = ref('')
const editing = computed(() => form.id > 0)

function edit(tag: AdminTag) {
  Object.assign(form, { id: tag.id, name: tag.name, slug: tag.slug, description: tag.description ?? '', is_staff_only: tag.is_staff_only,
    name_en: tag.translations?.en?.name ?? '', name_ja: tag.translations?.ja?.name ?? '' })
}
const reset = () => Object.assign(form, empty())

async function run(action: () => Promise<unknown>, done: string) {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = done
    await refresh()
  }
  catch (failure) { message.value = localizeError(failure, 'admin_pages.action_failed') }
  finally { busy.value = false }
}

const save = () => run(async () => {
  const translations = Object.fromEntries(([['en', form.name_en], ['ja', form.name_ja]] as const).filter(([, name]) => name.trim()).map(([code, name]) => [code, { name: name.trim() }]))
  const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, is_staff_only: form.is_staff_only, translations }
  await $api(editing.value ? `/v1/admin/tags/${form.id}` : '/v1/admin/tags', { method: editing.value ? 'PUT' : 'POST', body })
  reset()
}, t('admin_pages.saved'))

const mergeSource = ref<AdminTag | null>(null)
const mergeTarget = ref<number | null>(null)
const mergeOpen = computed({ get: () => mergeSource.value !== null, set: (open) => { if (!open) mergeSource.value = null } })
const merge = () => run(async () => {
  await $api(`/v1/admin/tags/${mergeSource.value!.id}/merge`, { method: 'POST', body: { target_id: mergeTarget.value } })
  mergeSource.value = null
}, t('admin_pages.tags.merged'))

const deleting = ref<AdminTag | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (open) => { if (!open) deleting.value = null } })
const remove = (reason: string) => run(async () => {
  await $api(`/v1/admin/tags/${deleting.value!.id}`, { method: 'DELETE', body: { reason } })
  deleting.value = null
}, t('admin_pages.tags.deleted'))

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => t('admin_pages.tags.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.tags.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.tags.description') }}</p>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section class="rounded-xl border border-slate-200 bg-white">
        <form class="flex gap-2 border-b border-slate-100 p-3" @submit.prevent="appliedSearch = search.trim()">
          <input v-model="search" type="search" maxlength="50" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" :placeholder="t('admin_pages.tags.search')">
          <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{{ t('admin_pages.apply') }}</button>
        </form>
        <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-2">{{ t('admin_pages.tags.name') }}</th><th class="px-4 py-2">Slug</th><th class="px-4 py-2">{{ t('admin_pages.tags.articles') }}</th><th class="px-4 py-2">{{ t('admin_pages.tags.topics') }}</th><th class="px-4 py-2" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="tag in data?.items" :key="tag.id">
                <td class="px-4 py-2">{{ tag.name }}<span v-if="tag.is_staff_only" class="ml-1.5 rounded bg-amber-50 px-1 text-[11px] text-amber-700">{{ t('admin_pages.tags.staff_only') }}</span><span v-if="tag.creator" class="ml-1.5 rounded bg-sky-50 px-1 text-[11px] text-sky-700" :title="t('admin_pages.tags.member_created_help')">{{ t('admin_pages.tags.member_created', { name: tag.creator.username }) }}</span></td>
                <td class="px-4 py-2 font-mono text-xs text-slate-500">{{ tag.slug }}</td>
                <td class="px-4 py-2 tabular-nums">{{ tag.articles_count }}</td>
                <td class="px-4 py-2 tabular-nums">{{ tag.discussion_topics_count }}</td>
                <td class="space-x-2 whitespace-nowrap px-4 py-2 text-right text-xs">
                  <button type="button" class="underline" @click="edit(tag)">{{ t('common.edit') }}</button>
                  <button type="button" class="underline" @click="mergeSource = tag; mergeTarget = null">{{ t('admin_pages.tags.merge') }}</button>
                  <button type="button" class="text-red-700 underline" @click="deleting = tag">{{ t('common.delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </AdminListState>
      </section>
      <form class="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm" @submit.prevent="save">
        <h2 class="font-semibold">{{ editing ? t('admin_pages.tags.edit') : t('admin_pages.tags.create') }}</h2>
        <label class="block">{{ t('admin_pages.tags.name') }}<input v-model="form.name" required maxlength="50" :class="field"></label>
        <label class="block">Slug<input v-model="form.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :class="[field, 'font-mono']"><span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.tags.slug_help') }}</span></label>
        <label class="block">{{ t('admin_pages.tags.name_en') }}<input v-model="form.name_en" maxlength="50" :class="field"></label>
        <label class="block">{{ t('admin_pages.tags.name_ja') }}<input v-model="form.name_ja" maxlength="50" :class="field"></label>
        <label class="block">{{ t('admin_pages.tags.tag_description') }}<textarea v-model="form.description" maxlength="500" rows="2" :class="field" /></label>
        <label class="flex items-center gap-2"><input v-model="form.is_staff_only" type="checkbox">{{ t('admin_pages.tags.staff_only_help') }}</label>
        <div class="flex justify-end gap-2">
          <button v-if="editing" type="button" class="rounded-lg border px-3 py-2" @click="reset">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ t('common.save') }}</button>
        </div>
      </form>
    </div>
    <AdminConfirmDialog v-model="mergeOpen" :busy="busy" :confirm-disabled="!mergeTarget" :title="t('admin_pages.tags.merge_title', { name: mergeSource?.name })" :description="t('admin_pages.tags.merge_help')" @confirm="merge">
      <select v-model="mergeTarget" class="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option :value="null" disabled>{{ t('admin_pages.tags.merge_target') }}</option>
        <option v-for="tag in data?.items.filter(item => item.id !== mergeSource?.id)" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
      </select>
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.tags.delete_title', { name: deleting?.name })" :description="t('admin_pages.tags.delete_help')" @confirm="remove" />
  </div>
</template>
