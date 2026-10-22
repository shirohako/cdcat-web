<script setup lang="ts">
import type { AdminMailCategory } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t, mailError, fieldErrors, localeName, categoryName } = useAdminMail()
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
    notice.value = t('admin_pages.saved')
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
    notice.value = t('admin_pages.mail.categories.deleted', { key: category.key })
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
useHead({ title: computed(() => t('admin_pages.mail.categories.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.mail.categories.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.mail.categories.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="open()">{{ t('admin_pages.mail.categories.create') }}</button>
    </header>

    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? t('admin_pages.mail.categories.edit', { key: editing.key }) : t('admin_pages.mail.categories.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block sm:col-span-2">{{ t('admin_pages.mail.categories.key') }}
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,29}" maxlength="30" :class="[input, 'font-mono']">
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.mail.categories.key_help') }}</span>
          <span v-for="keyError in fieldError('key')" :key="keyError" class="mt-1 block text-xs text-red-700">{{ keyError }}</span>
        </label>
        <label v-for="locale in locales" :key="`name-${locale}`" class="block">{{ t('admin_pages.mail.categories.name_in', { language: localeName(locale) }) }}<span v-if="locale === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[locale]" :required="locale === 'en'" maxlength="50" :class="input">
        </label>
        <label v-for="locale in locales" :key="`description-${locale}`" class="block">{{ t('admin_pages.mail.categories.description_in', { language: localeName(locale) }) }}
          <textarea v-model="form.descriptions[locale]" rows="2" maxlength="300" :class="input" />
        </label>
        <p v-for="textError in [...fieldError('names'), ...fieldError('descriptions')]" :key="textError" class="text-xs text-red-700 sm:col-span-2">{{ textError }}</p>
        <div class="space-y-2 sm:col-span-2">
          <label class="flex items-center gap-1.5"><input v-model="form.is_required" type="checkbox" :disabled="!!editing">{{ t('admin_pages.mail.categories.is_required') }}</label>
          <p class="text-xs text-slate-500">{{ t('admin_pages.mail.categories.is_required_help') }}</p>
          <label class="flex items-center gap-1.5"><input v-model="form.is_default_subscribed" type="checkbox" :disabled="form.is_required">{{ t('admin_pages.mail.categories.is_default_subscribed') }}</label>
          <p class="text-xs text-slate-500">{{ t('admin_pages.mail.categories.is_default_subscribed_help') }}</p>
          <label class="flex items-center gap-1.5"><input v-model="form.is_active" type="checkbox">{{ t('admin_pages.mail.categories.is_active') }}</label>
        </div>
        <label class="block">{{ t('admin_pages.mail.categories.sort_order') }}
          <input v-model.number="form.sort_order" type="number" min="0" :class="input">
        </label>
        <label class="block sm:col-span-2">{{ t('admin_pages.optional_reason') }}
          <input v-model="form.reason" maxlength="2000" :class="input">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('common.save') }}</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="formOpen = false">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!categories.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-180 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('admin_pages.mail.categories.key') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.categories.names') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.categories.rules') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.categories.sort_order') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.categories.usage') }}</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="category in categories" :key="category.id" :class="{ 'opacity-50': !category.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ category.key }}<span v-if="!category.is_active" class="ml-1 font-sans text-slate-500">（{{ t('admin_pages.mail.categories.inactive') }}）</span></td>
                <td class="px-3 py-3">
                  {{ categoryName(category) }} <span class="text-xs text-slate-500">{{ category.names.en }}</span>
                  <p v-if="category.descriptions['zh-Hans'] || category.descriptions.en" class="mt-1 max-w-md text-xs text-slate-500">{{ category.descriptions['zh-Hans'] || category.descriptions.en }}</p>
                </td>
                <td class="px-3 py-3 text-xs">
                  <span v-if="category.is_required" class="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">{{ t('admin_pages.mail.categories.required') }}</span>
                  <span v-else>{{ category.is_default_subscribed ? t('admin_pages.mail.categories.default_on') : t('admin_pages.mail.categories.default_off') }}</span>
                </td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ category.sort_order }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ t('admin_pages.mail.categories.usage_value', { ...category.usage }) }}</td>
                <td class="px-3 py-3 text-right text-xs">
                  <button type="button" class="underline" @click="open(category)">{{ t('common.edit') }}</button>
                  <button type="button" class="ml-3 text-red-700 underline disabled:opacity-40" :disabled="category.usage.campaigns > 0" :title="category.usage.campaigns ? t('admin_pages.mail.categories.in_use') : undefined" @click="deleting = category">{{ t('common.delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.mail.categories.delete_title', { key: deleting?.key ?? '' })" :description="t('admin_pages.mail.categories.delete_help')" @confirm="remove" />
  </div>
</template>
