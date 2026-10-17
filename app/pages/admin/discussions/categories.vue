<script setup lang="ts">
import { GripVertical, Lock } from '@lucide/vue'
import type { AdminDiscussionCategory } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError(t)
const { data, pending, error, refresh } = await useAsyncData('admin-discussion-categories',
  () => $api<{ items: AdminDiscussionCategory[], colors: string[] }>('/v1/admin/discussions/categories'))

const ordered = ref<AdminDiscussionCategory[]>([])
watch(data, (value) => {
  const items = value?.items ?? []
  const parents = items.filter(item => item.parent_id === null).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  ordered.value = parents.flatMap(parent => [parent, ...items.filter(item => item.parent_id === parent.id).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)])
}, { immediate: true })
const parents = computed(() => ordered.value.filter(item => item.parent_id === null))
const dirtyOrder = ref(false)

const empty = () => ({
  id: 0, parent_id: null as number | null, name: '', slug: '', description: '', name_en: '', name_ja: '', name_zh_hant: '',
  color: 'slate', icon: '', kind: 'discussion' as 'discussion' | 'question', topic_permission: 'everyone' as 'everyone' | 'moderators',
  visibility: 'public' as 'public' | 'staff', is_archived: false, topic_template: '', show_in_latest: true,
})
const form = reactive(empty())
const editing = computed(() => form.id > 0)
const busy = ref(false)
const message = ref('')
const notice = ref('')

function edit(category: AdminDiscussionCategory) {
  Object.assign(form, {
    id: category.id, parent_id: category.parent_id, name: category.name, slug: category.slug, description: category.description ?? '',
    name_en: category.translations?.en?.name ?? '', name_ja: category.translations?.ja?.name ?? '', name_zh_hant: category.translations?.['zh-Hant']?.name ?? '',
    color: category.color ?? 'slate', icon: category.icon ?? '', kind: category.kind, topic_permission: category.topic_permission,
    visibility: category.visibility, is_archived: category.is_archived, topic_template: category.topic_template ?? '', show_in_latest: category.show_in_latest,
  })
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
  const translations = Object.fromEntries(([['en', form.name_en], ['ja', form.name_ja], ['zh-Hant', form.name_zh_hant]] as const)
    .filter(([, name]) => name.trim()).map(([code, name]) => [code, { name: name.trim() }]))
  const body = {
    parent_id: form.parent_id, name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, translations,
    color: form.color || null, icon: form.icon.trim() || null, kind: form.kind, topic_permission: form.topic_permission, visibility: form.visibility,
    is_archived: form.is_archived, topic_template: form.topic_template.trim() || null, show_in_latest: form.show_in_latest,
  }
  await $api(editing.value ? `/v1/admin/discussions/categories/${form.id}` : '/v1/admin/discussions/categories', { method: editing.value ? 'PUT' : 'POST', body })
  reset()
}, t('admin_pages.saved'))

const deleting = ref<AdminDiscussionCategory | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (open) => { if (!open) deleting.value = null } })
const remove = (reason: string) => run(async () => {
  await $api(`/v1/admin/discussions/categories/${deleting.value!.id}`, { method: 'DELETE', body: { reason: reason || undefined } })
  deleting.value = null
}, t('admin_pages.discussions.categories.deleted'))

// Drag a category among its siblings; children follow their parent.
const dragged = ref<number | null>(null)
function drop(target: AdminDiscussionCategory) {
  const source = ordered.value.find(item => item.id === dragged.value)
  dragged.value = null
  if (!source || source.id === target.id || source.parent_id !== target.parent_id) return
  const siblings = ordered.value.filter(item => item.parent_id === source.parent_id)
  const without = siblings.filter(item => item.id !== source.id)
  without.splice(without.findIndex(item => item.id === target.id), 0, source)
  without.forEach((item, index) => { item.sort_order = index })
  const items = ordered.value.slice()
  const roots = items.filter(item => item.parent_id === null).sort((a, b) => a.sort_order - b.sort_order)
  ordered.value = roots.flatMap(root => [root, ...items.filter(item => item.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order)])
  dirtyOrder.value = true
}
const saveOrder = () => run(async () => {
  await $api('/v1/admin/discussions/categories/order', { method: 'PUT', body: { items: ordered.value.map(item => ({ id: item.id, parent_id: item.parent_id, sort_order: item.sort_order })) } })
  dirtyOrder.value = false
}, t('admin_pages.discussions.categories.ordered'))

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => t('admin_pages.discussions.categories.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.discussions.categories.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.discussions.categories.description') }}</p>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section class="rounded-xl border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>{{ t('admin_pages.discussions.categories.drag_hint') }}</span>
          <button v-if="dirtyOrder" type="button" class="rounded-lg bg-slate-900 px-3 py-1.5 text-white disabled:opacity-50" :disabled="busy" @click="saveOrder">{{ t('admin_pages.discussions.categories.save_order') }}</button>
        </div>
        <AdminListState :pending="pending" :error="error" :empty="!ordered.length" @retry="refresh()">
          <ul class="divide-y divide-slate-100">
            <li
              v-for="category in ordered" :key="category.id" draggable="true" class="flex items-center gap-3 py-2.5 pr-4 text-sm"
              :class="[category.parent_id ? 'pl-10' : 'pl-3', dragged === category.id ? 'opacity-40' : '']"
              @dragstart="dragged = category.id" @dragover.prevent @drop.prevent="drop(category)" @dragend="dragged = null"
            >
              <GripVertical :size="14" class="shrink-0 cursor-grab text-slate-300" />
              <span class="size-2.5 shrink-0 rounded-full" :class="categoryTone(category.color).dot" />
              <div class="min-w-0 flex-1">
                <p class="font-medium">
                  {{ category.name }}
                  <span class="ml-1 font-mono text-xs text-slate-400">{{ category.slug }}</span>
                  <Lock v-if="category.visibility === 'staff'" :size="12" class="ml-1 inline text-slate-400" />
                </p>
                <p class="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                  <span v-if="category.kind === 'question'" class="rounded bg-emerald-50 px-1 text-emerald-700">{{ t('admin_pages.discussions.categories.kinds.question') }}</span>
                  <span v-if="category.topic_permission === 'moderators'" class="rounded bg-indigo-50 px-1 text-indigo-700">{{ t('admin_pages.discussions.categories.moderators_only') }}</span>
                  <span v-if="!category.show_in_latest" class="rounded bg-slate-100 px-1">{{ t('admin_pages.discussions.categories.not_in_latest') }}</span>
                  <span v-if="category.is_archived" class="rounded bg-amber-50 px-1 text-amber-700">{{ t('admin_pages.discussions.categories.archived') }}</span>
                  <span v-if="category.is_system" class="rounded bg-sky-50 px-1 text-sky-700">{{ t('admin_pages.discussions.categories.system') }}</span>
                  <span>{{ t('admin_pages.discussions.categories.topics', { count: category.topics_count }) }}</span>
                </p>
              </div>
              <div class="flex shrink-0 gap-2 text-xs">
                <button type="button" class="underline" @click="edit(category)">{{ t('common.edit') }}</button>
                <button v-if="!category.is_system" type="button" class="text-red-700 underline disabled:opacity-40" :disabled="category.topics_count > 0" @click="deleting = category">{{ t('common.delete') }}</button>
              </div>
            </li>
          </ul>
        </AdminListState>
      </section>
      <form class="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm" @submit.prevent="save">
        <h2 class="font-semibold">{{ editing ? t('admin_pages.discussions.categories.edit') : t('admin_pages.discussions.categories.create') }}</h2>
        <label class="block">{{ t('admin_pages.discussions.categories.name') }}<input v-model="form.name" required maxlength="50" :class="field"></label>
        <label class="block">Slug<input v-model="form.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :class="[field, 'font-mono']"></label>
        <label class="block">{{ t('admin_pages.discussions.categories.parent') }}
          <select v-model="form.parent_id" :class="field">
            <option :value="null">{{ t('admin_pages.discussions.categories.top_level') }}</option>
            <option v-for="parent in parents.filter(item => item.id !== form.id)" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
          </select>
        </label>
        <label class="block">{{ t('admin_pages.discussions.categories.category_description') }}<textarea v-model="form.description" maxlength="1000" rows="2" :class="field" /></label>
        <div class="grid grid-cols-3 gap-2">
          <label class="block text-xs">繁體<input v-model="form.name_zh_hant" maxlength="50" :class="field"></label>
          <label class="block text-xs">English<input v-model="form.name_en" maxlength="50" :class="field"></label>
          <label class="block text-xs">日本語<input v-model="form.name_ja" maxlength="50" :class="field"></label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="block">{{ t('admin_pages.discussions.categories.color') }}
            <select v-model="form.color" :class="field"><option v-for="color in data?.colors ?? []" :key="color" :value="color">{{ color }}</option></select>
          </label>
          <label class="block">{{ t('admin_pages.discussions.categories.icon') }}<input v-model="form.icon" maxlength="50" pattern="[a-z0-9-]+" placeholder="message-circle" :class="field"></label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="block">{{ t('admin_pages.discussions.categories.kind') }}
            <select v-model="form.kind" :class="field"><option value="discussion">{{ t('admin_pages.discussions.categories.kinds.discussion') }}</option><option value="question">{{ t('admin_pages.discussions.categories.kinds.question') }}</option></select>
          </label>
          <label class="block">{{ t('admin_pages.discussions.categories.visibility') }}
            <select v-model="form.visibility" :class="field"><option value="public">{{ t('admin_pages.discussions.categories.visibilities.public') }}</option><option value="staff">{{ t('admin_pages.discussions.categories.visibilities.staff') }}</option></select>
          </label>
        </div>
        <label class="flex items-center gap-2"><input v-model="form.topic_permission" type="checkbox" true-value="moderators" false-value="everyone">{{ t('admin_pages.discussions.categories.moderators_only_help') }}</label>
        <label class="flex items-center gap-2"><input v-model="form.show_in_latest" type="checkbox">{{ t('admin_pages.discussions.categories.show_in_latest') }}</label>
        <label class="flex items-center gap-2"><input v-model="form.is_archived" type="checkbox">{{ t('admin_pages.discussions.categories.archive_help') }}</label>
        <label class="block">{{ t('admin_pages.discussions.categories.template') }}<textarea v-model="form.topic_template" maxlength="5000" rows="4" :class="[field, 'font-mono text-xs']" :placeholder="t('admin_pages.discussions.categories.template_placeholder')" /></label>
        <div class="flex justify-end gap-2">
          <button v-if="editing" type="button" class="rounded-lg border px-3 py-2" @click="reset">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ t('common.save') }}</button>
        </div>
      </form>
    </div>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" :title="t('admin_pages.discussions.categories.delete_title', { name: deleting?.name })" :description="t('admin_pages.discussions.categories.delete_help')" @confirm="remove" />
  </div>
</template>
