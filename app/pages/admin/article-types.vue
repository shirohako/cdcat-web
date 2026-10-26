<script setup lang="ts">
import type { AdminArticleType } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const LANGUAGES = ['zh-Hans', 'en', 'ja', 'zh-Hant'] as const

const { $api } = useNuxtApp()
// The writer's picker and article labels read GET /article-types; refresh it after a change.
const { refresh: refreshPublic } = useArticleTypes()

const { data, pending, error, refresh } = await useAsyncData('admin-article-types', () => $api<AdminArticleType[]>('/v1/admin/article-types'))
const types = computed(() => data.value ?? [])

const empty = () => ({ key: '', names: { 'zh-Hans': '', en: '', ja: '', 'zh-Hant': '' } as Record<string, string>, sort_order: 0, is_active: true, reason: '' })
const form = reactive(empty())
const editing = ref<string | null>(null)
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')

const open = (type?: AdminArticleType) => {
  message.value = ''
  Object.assign(form, empty())
  editing.value = type?.key ?? null
  if (type) {
    Object.assign(form, { key: type.key, names: { ...form.names, ...type.names }, sort_order: type.sort_order, is_active: type.is_active })
  } else {
    form.sort_order = Math.max(0, ...types.value.map(item => item.sort_order)) + 10
  }
  formOpen.value = true
}

const save = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      names: Object.fromEntries(Object.entries(form.names).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])),
      sort_order: form.sort_order, is_active: form.is_active, reason: form.reason.trim() || null,
    }
    await $api(editing.value ? `/v1/admin/article-types/${editing.value}` : '/v1/admin/article-types', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? body : { ...body, key: form.key.trim() },
    })
    formOpen.value = false
    notice.value = '已保存'
    await Promise.all([refresh(), refreshPublic()])
  } catch (failure) {
    message.value = adminError(failure)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminArticleType | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (value) => { if (!value) deleting.value = null } })
const remove = async (reason: string) => {
  const type = deleting.value
  if (!type) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/article-types/${type.key}`, { method: 'DELETE', body: { reason } })
    notice.value = `已删除类型 ${type.key}`
    await Promise.all([refresh(), refreshPublic()])
  } catch (failure) {
    message.value = adminError(failure)
  } finally {
    deleting.value = null
    busy.value = false
  }
}

const used = (type: AdminArticleType) => type.usage.articles
useHead({ title: '文章类型' })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">文章类型</h1>
        <p class="mt-2 text-sm text-slate-600">写文章时可选的类型。key 创建后不能改；被文章用过的类型不能删除，可以停用：停用后不能再选，已有的文章保留原类型。</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="open()">新建类型</button>
    </header>

    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? `编辑类型 ${editing}` : '新建类型' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block sm:col-span-2">Key
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,19}" maxlength="20" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono disabled:bg-slate-100">
          <span class="mt-1 block text-xs text-slate-500">小写字母开头，可用小写字母、数字和下划线，最多 20 个字符，创建后不能修改。</span>
        </label>
        <label v-for="language in LANGUAGES" :key="language" class="block">名称（{{ language }}）<span v-if="language === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[language]" :required="language === 'en'" maxlength="50" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="block">排序
          <input v-model.number="form.sort_order" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="flex items-center gap-1.5 self-end pb-2"><input v-model="form.is_active" type="checkbox">启用</label>
        <label class="block sm:col-span-2">原因（可选，写入操作日志）
          <input v-model="form.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">保存</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="formOpen = false">取消</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!types.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-160 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">Key</th>
                <th class="px-3 py-3">名称</th>
                <th class="px-3 py-3">排序</th>
                <th class="px-3 py-3">使用情况</th>
                <th class="px-3 py-3">启用</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="type in types" :key="type.key" :class="{ 'text-slate-400': !type.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ type.key }}</td>
                <td class="px-3 py-3">{{ type.names['zh-Hans'] || type.names.en }} <span class="text-xs text-slate-500">{{ type.names.en }}</span></td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ type.sort_order }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ type.usage.articles }} 篇文章</td>
                <td class="px-3 py-3 text-xs">
                  <span class="rounded px-1.5 py-0.5" :class="type.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ type.is_active ? '启用' : '已停用' }}</span>
                </td>
                <td class="px-3 py-3 text-right text-xs">
                  <button type="button" class="underline" @click="open(type)">编辑</button>
                  <button type="button" class="ml-3 text-red-700 underline disabled:opacity-40" :disabled="used(type) > 0" :title="used(type) ? '已被文章使用，只能停用' : undefined" @click="deleting = type">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除类型 ${deleting?.key ?? ''}`" description="只有没有任何文章（包括草稿）使用的类型才能删除。" @confirm="remove" />
  </div>
</template>
