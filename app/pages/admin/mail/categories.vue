<script setup lang="ts">
import type { AdminMailCategory } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { mailError, fieldErrors, localeName, categoryName } = useAdminMail()
const locales = ADMIN_MAIL_LOCALES
const { data, pending, error, refresh } = await useAsyncData('admin-mail-categories',
  () => $api<{ mail_categories: AdminMailCategory[] }>('/v1/admin/mail/categories').then(response => response.mail_categories))
const categories = computed(() => data.value ?? [])

const blankTexts = () => Object.fromEntries(locales.map(locale => [locale, ''])) as Record<string, string>
const empty = () => ({ key: '', names: blankTexts(), descriptions: blankTexts(), is_required: false, is_default_subscribed: true, is_active: true, sort_order: 0, reason: '' })
const form = reactive(empty())
const editing = ref<AdminMailCategory | null>(null)
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')
const errors = ref<Record<string, string[]>>({})

const open = (category?: AdminMailCategory) => {
  message.value = ''
  errors.value = {}
  Object.assign(form, empty())
  editing.value = category ?? null
  if (category) {
    Object.assign(form, {
      key: category.key, names: { ...form.names, ...category.names }, descriptions: { ...form.descriptions, ...category.descriptions },
      is_required: category.is_required, is_default_subscribed: category.is_default_subscribed, is_active: category.is_active, sort_order: category.sort_order,
    })
  } else {
    form.sort_order = Math.max(0, ...categories.value.map(item => item.sort_order)) + 10
  }
  formOpen.value = true
}
const texts = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()).map(([locale, value]) => [locale, value.trim()]))
const save = async () => {
  busy.value = true
  message.value = ''
  errors.value = {}
  try {
    const body = {
      names: texts(form.names), descriptions: texts(form.descriptions), is_default_subscribed: form.is_default_subscribed,
      is_active: form.is_active, sort_order: form.sort_order, reason: form.reason.trim() || null,
    }
    await $api(editing.value ? `/v1/admin/mail/categories/${editing.value.id}` : '/v1/admin/mail/categories', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? body : { ...body, key: form.key.trim(), is_required: form.is_required },
    })
    formOpen.value = false
    notice.value = '已保存'
    await refresh()
  } catch (failure) {
    message.value = mailError(failure)
    errors.value = fieldErrors(failure)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminMailCategory | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (value) => { if (!value) deleting.value = null } })
const remove = async (reason: string) => {
  const category = deleting.value
  if (!category) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/mail/categories/${category.id}`, { method: 'DELETE', body: { reason } })
    notice.value = `已删除类型 ${category.key}`
    await refresh()
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    deleting.value = null
    busy.value = false
  }
}
const fieldError = (name: string) => Object.entries(errors.value).filter(([key]) => key === name || key.startsWith(`${name}.`)).flatMap(([, messages]) => messages)
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100'
useHead({ title: '邮件类型' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">邮件类型</h1>
        <p class="mt-2 text-sm text-slate-600">群发邮件都属于一个类型，用户在设置里按类型订阅或退订。必收类型发给所有正常账号，不能退订。</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="open()">新建类型</button>
    </header>

    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? `编辑类型 ${editing.key}` : '新建类型' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block sm:col-span-2">键
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,29}" maxlength="30" :class="[input, 'font-mono']">
          <span class="mt-1 block text-xs text-slate-500">以小写字母开头，只能用小写字母、数字和下划线，创建后不能修改。</span>
          <span v-for="keyError in fieldError('key')" :key="keyError" class="mt-1 block text-xs text-red-700">{{ keyError }}</span>
        </label>
        <label v-for="locale in locales" :key="`name-${locale}`" class="block">名称（{{ localeName(locale) }}）<span v-if="locale === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[locale]" :required="locale === 'en'" maxlength="50" :class="input">
        </label>
        <label v-for="locale in locales" :key="`description-${locale}`" class="block">说明（{{ localeName(locale) }}）
          <textarea v-model="form.descriptions[locale]" rows="2" maxlength="300" :class="input" />
        </label>
        <p v-for="textError in [...fieldError('names'), ...fieldError('descriptions')]" :key="textError" class="text-xs text-red-700 sm:col-span-2">{{ textError }}</p>
        <div class="space-y-2 sm:col-span-2">
          <label class="flex items-center gap-1.5"><input v-model="form.is_required" type="checkbox" :disabled="!!editing">必收</label>
          <p class="text-xs text-slate-500">必收类型不能退订，邮件里也没有退订链接。只能在创建时设定，之后不能修改，免得把已经退订的人变成必收。</p>
          <label class="flex items-center gap-1.5"><input v-model="form.is_default_subscribed" type="checkbox" :disabled="form.is_required">默认订阅</label>
          <p class="text-xs text-slate-500">没表过态的用户是否收这个类型；点过「退订全部」的用户不会因此收到。</p>
          <label class="flex items-center gap-1.5"><input v-model="form.is_active" type="checkbox">启用</label>
        </div>
        <label class="block">排序
          <input v-model.number="form.sort_order" type="number" min="0" :class="input">
        </label>
        <label class="block sm:col-span-2">原因（可选，写入操作日志）
          <input v-model="form.reason" maxlength="2000" :class="input">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">保存</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="formOpen = false">取消</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!categories.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-180 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">键</th>
                <th class="px-3 py-3">名称</th>
                <th class="px-3 py-3">规则</th>
                <th class="px-3 py-3">排序</th>
                <th class="px-3 py-3">使用情况</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="category in categories" :key="category.id" :class="{ 'opacity-50': !category.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ category.key }}<span v-if="!category.is_active" class="ml-1 font-sans text-slate-500">（已停用）</span></td>
                <td class="px-3 py-3">
                  {{ categoryName(category) }} <span class="text-xs text-slate-500">{{ category.names.en }}</span>
                  <p v-if="category.descriptions['zh-Hans'] || category.descriptions.en" class="mt-1 max-w-md text-xs text-slate-500">{{ category.descriptions['zh-Hans'] || category.descriptions.en }}</p>
                </td>
                <td class="px-3 py-3 text-xs">
                  <span v-if="category.is_required" class="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">必收</span>
                  <span v-else>{{ category.is_default_subscribed ? '默认订阅' : '默认不订阅' }}</span>
                </td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ category.sort_order }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">群发 {{ category.usage.campaigns }} 次 · {{ category.usage.unsubscribed }} 人退订</td>
                <td class="px-3 py-3 text-right text-xs">
                  <button type="button" class="underline" @click="open(category)">编辑</button>
                  <button type="button" class="ml-3 text-red-700 underline disabled:opacity-40" :disabled="category.usage.campaigns > 0" :title="category.usage.campaigns ? '群发用过的类型不能删除，可以停用' : undefined" @click="deleting = category">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除类型 ${deleting?.key ?? ''}？`" description="用户对这个类型的订阅记录会一起删除。" @confirm="remove" />
  </div>
</template>
