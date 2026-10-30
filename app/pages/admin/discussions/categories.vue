<script setup lang="ts">
import { GripVertical, Lock } from '@lucide/vue'
import type { AdminDiscussionCategory } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
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
  id: 0, parent_id: null as number | null, name: '', slug: '', description: '', name_en: '', name_ja: '', name_zh_hant: '', name_ko: '',
  color: 'slate', icon: '', kind: 'discussion' as 'discussion' | 'question', topic_permission: 'everyone' as 'everyone' | 'moderators',
  visibility: 'public' as 'public' | 'moderators', is_archived: false, topic_template: '', show_in_latest: true, show_in_list: true,
})
const form = reactive(empty())
const editing = computed(() => form.id > 0)
const busy = ref(false)
const message = ref('')
const notice = ref('')

function edit(category: AdminDiscussionCategory) {
  Object.assign(form, {
    id: category.id, parent_id: category.parent_id, name: category.name, slug: category.slug, description: category.description ?? '',
    name_en: category.translations?.en?.name ?? '', name_ja: category.translations?.ja?.name ?? '', name_zh_hant: category.translations?.['zh-Hant']?.name ?? '', name_ko: category.translations?.ko?.name ?? '',
    color: category.color ?? 'slate', icon: category.icon ?? '', kind: category.kind, topic_permission: category.topic_permission,
    visibility: category.visibility, is_archived: category.is_archived, topic_template: category.topic_template ?? '', show_in_latest: category.show_in_latest,
    show_in_list: category.show_in_list,
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
  catch (failure) { message.value = adminError(failure, '操作失败，请重试。') }
  finally { busy.value = false }
}

const save = () => run(async () => {
  const translations = Object.fromEntries(([['en', form.name_en], ['ja', form.name_ja], ['zh-Hant', form.name_zh_hant], ['ko', form.name_ko]] as const)
    .filter(([, name]) => name.trim()).map(([code, name]) => [code, { name: name.trim() }]))
  const body = {
    parent_id: form.parent_id, name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, translations,
    color: form.color || null, icon: form.icon.trim() || null, kind: form.kind, topic_permission: form.topic_permission, visibility: form.visibility,
    is_archived: form.is_archived, topic_template: form.topic_template.trim() || null, show_in_latest: form.show_in_latest,
    show_in_list: form.show_in_list,
  }
  await $api(editing.value ? `/v1/admin/discussions/categories/${form.id}` : '/v1/admin/discussions/categories', { method: editing.value ? 'PUT' : 'POST', body })
  reset()
}, '已保存')

const deleting = ref<AdminDiscussionCategory | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (open) => { if (!open) deleting.value = null } })
const remove = (reason: string) => run(async () => {
  await $api(`/v1/admin/discussions/categories/${deleting.value!.id}`, { method: 'DELETE', body: { reason: reason || undefined } })
  deleting.value = null
}, '版块已删除')

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
}, '排序已保存')

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: '讨论版块' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">讨论版块</h1>
      <p class="mt-2 text-sm text-slate-600">最多两层。拖动调整同级顺序；还有主题的版块不能删除，要先移走。</p>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section class="rounded-xl border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>拖动条目调整同级版块的顺序</span>
          <UiButton v-if="dirtyOrder" variant="primary" size="xs" :disabled="busy" @click="saveOrder">保存排序</UiButton>
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
                  <Lock v-if="category.visibility === 'moderators'" :size="12" class="ml-1 inline text-slate-400" />
                </p>
                <p class="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                  <span v-if="category.kind === 'question'" class="rounded bg-emerald-50 px-1 text-emerald-700">问答</span>
                  <span v-if="category.topic_permission === 'moderators'" class="rounded bg-indigo-50 px-1 text-indigo-700">仅版主发主题</span>
                  <span v-if="!category.show_in_latest" class="rounded bg-slate-100 px-1">不进「最新」</span>
                  <span v-if="!category.show_in_list" class="rounded bg-slate-100 px-1">不在版块列表</span>
                  <span v-if="category.is_archived" class="rounded bg-amber-50 px-1 text-amber-700">已归档</span>
                  <span v-if="category.is_system" class="rounded bg-sky-50 px-1 text-sky-700">系统版块</span>
                  <span>{{ category.topics_count }} 个主题</span>
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <UiButton size="xs" @click="edit(category)">编辑</UiButton>
                <UiButton v-if="!category.is_system" variant="danger-soft" size="xs" :disabled="category.topics_count > 0" @click="deleting = category">删除</UiButton>
              </div>
            </li>
          </ul>
        </AdminListState>
      </section>
      <form class="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm" @submit.prevent="save">
        <h2 class="font-semibold">{{ editing ? '编辑版块' : '新建版块' }}</h2>
        <label class="block">名称<input v-model="form.name" required maxlength="50" :class="field"></label>
        <label class="block">Slug<input v-model="form.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :class="[field, 'font-mono']"></label>
        <label class="block">上级版块
          <select v-model="form.parent_id" :class="field">
            <option :value="null">（顶级版块）</option>
            <option v-for="parent in parents.filter(item => item.id !== form.id)" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
          </select>
        </label>
        <label class="block">说明<textarea v-model="form.description" maxlength="1000" rows="2" :class="field" /></label>
        <div class="grid grid-cols-4 gap-2">
          <label class="block text-xs">繁體<input v-model="form.name_zh_hant" maxlength="50" :class="field"></label>
          <label class="block text-xs">English<input v-model="form.name_en" maxlength="50" :class="field"></label>
          <label class="block text-xs">日本語<input v-model="form.name_ja" maxlength="50" :class="field"></label>
          <label class="block text-xs">한국어<input v-model="form.name_ko" maxlength="50" :class="field"></label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="block">颜色
            <select v-model="form.color" :class="field"><option v-for="color in data?.colors ?? []" :key="color" :value="color">{{ color }}</option></select>
          </label>
          <label class="block">图标（lucide 名称）<input v-model="form.icon" maxlength="50" pattern="[a-z0-9-]+" placeholder="message-circle" :class="field"></label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="block">类型
            <select v-model="form.kind" :class="field"><option value="discussion">普通</option><option value="question">问答</option></select>
          </label>
          <label class="block">可见范围
            <select v-model="form.visibility" :class="field"><option value="public">公开</option><option value="moderators">仅版主</option></select>
          </label>
        </div>
        <label class="flex items-center gap-2"><input v-model="form.topic_permission" type="checkbox" true-value="moderators" false-value="everyone">只有版主能发主题（其他人可以回复）</label>
        <label class="flex items-center gap-2"><input v-model="form.show_in_latest" type="checkbox">出现在讨论区首页的「最新」里</label>
        <label class="flex items-center gap-2"><input v-model="form.show_in_list" type="checkbox">显示在版块列表和侧栏里（关掉后仍可通过链接打开）</label>
        <label class="flex items-center gap-2"><input v-model="form.is_archived" type="checkbox">归档：不能再发主题和回复</label>
        <label class="block">发帖模板<textarea
v-model="form.topic_template" maxlength="5000" rows="4" :class="[field, 'font-mono text-xs']" placeholder="发主题时预填到编辑器里，例如：
曲目信息：
试听链接：
出处：" /></label>
        <div class="flex justify-end gap-2">
          <UiButton v-if="editing" @click="reset">取消</UiButton>
          <UiButton type="submit" variant="primary" :disabled="busy">保存</UiButton>
        </div>
      </form>
    </div>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" :title="`删除版块「${deleting?.name}」？`" description="版块里没有主题和子版块时才能删除。" @confirm="remove" />
  </div>
</template>
