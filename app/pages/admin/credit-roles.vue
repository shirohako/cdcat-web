<script setup lang="ts">
import type { AdminCreditRole } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const CATEGORIES = ['composition', 'lyrics', 'arrangement', 'vocals', 'performance', 'production', 'engineering', 'artwork', 'other'] as const
const LANGUAGES = ['zh-Hans', 'en', 'ja', 'zh-Hant'] as const
const LEVELS = ['is_album_role', 'is_track_role'] as const

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const { data, pending, error, refresh } = await useAsyncData('admin-credit-roles', () => $api<AdminCreditRole[]>('/v1/admin/credit-roles'))
const roles = computed(() => data.value ?? [])
const category = ref('')
const shown = computed(() => roles.value.filter(role => !category.value || role.category === category.value))

const empty = () => ({
  key: '', category: 'composition', names: { 'zh-Hans': '', en: '', ja: '', 'zh-Hant': '' } as Record<string, string>, aliases: '',
  is_album_role: true, is_track_role: true, sort_order: 0, is_active: true, reason: '',
})
const form = reactive(empty())
const editing = ref<string | null>(null)
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')

const open = (role?: AdminCreditRole) => {
  message.value = ''
  Object.assign(form, empty())
  editing.value = role?.key ?? null
  if (role) {
    Object.assign(form, {
      key: role.key, category: role.category, names: { ...form.names, ...role.names }, aliases: (role.aliases ?? []).join(', '),
      is_album_role: role.is_album_role, is_track_role: role.is_track_role, sort_order: role.sort_order, is_active: role.is_active,
    })
  } else {
    form.sort_order = Math.max(0, ...roles.value.map(item => item.sort_order)) + 10
  }
  formOpen.value = true
}

const save = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      category: form.category,
      names: Object.fromEntries(Object.entries(form.names).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])),
      aliases: form.aliases.split(/[,，]/).map(alias => alias.trim()).filter(Boolean),
      is_album_role: form.is_album_role, is_track_role: form.is_track_role,
      sort_order: form.sort_order, is_active: form.is_active, reason: form.reason.trim() || null,
    }
    await $api(editing.value ? `/v1/admin/credit-roles/${editing.value}` : '/v1/admin/credit-roles', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? body : { ...body, key: form.key.trim() },
    })
    formOpen.value = false
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminCreditRole | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (value) => { if (!value) deleting.value = null } })
const remove = async (reason: string) => {
  const role = deleting.value
  if (!role) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/credit-roles/${role.key}`, { method: 'DELETE', body: { reason } })
    notice.value = t('admin_pages.credit_roles.deleted', { key: role.key })
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    deleting.value = null
    busy.value = false
  }
}

const used = (role: AdminCreditRole) => role.usage.album + role.usage.track
useHead({ title: computed(() => t('admin_pages.credit_roles.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.credit_roles.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.credit_roles.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="open()">{{ t('admin_pages.credit_roles.create') }}</button>
    </header>

    <AdminFilterBar>
      <select v-model="category" :aria-label="t('admin_pages.credit_roles.category')" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">{{ t('admin_pages.credit_roles.all_categories') }}</option>
        <option v-for="value in CATEGORIES" :key="value" :value="value">{{ t(`admin_pages.credit_roles.categories.${value}`) }}</option>
      </select>
    </AdminFilterBar>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? t('admin_pages.credit_roles.edit', { key: editing }) : t('admin_pages.credit_roles.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">{{ t('admin_pages.credit_roles.key') }}
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,39}" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono disabled:bg-slate-100">
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.credit_roles.key_help') }}</span>
        </label>
        <label class="block">{{ t('admin_pages.credit_roles.category') }}
          <select v-model="form.category" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option v-for="value in CATEGORIES" :key="value" :value="value">{{ t(`admin_pages.credit_roles.categories.${value}`) }}</option>
          </select>
        </label>
        <label v-for="language in LANGUAGES" :key="language" class="block">{{ t('admin_pages.credit_roles.name_in', { language }) }}<span v-if="language === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[language]" :required="language === 'en'" maxlength="100" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="block sm:col-span-2">{{ t('admin_pages.credit_roles.aliases') }}
          <input v-model="form.aliases" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" :placeholder="t('admin_pages.credit_roles.aliases_placeholder')">
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.credit_roles.aliases_help') }}</span>
        </label>
        <fieldset class="sm:col-span-2">
          <legend>{{ t('admin_pages.credit_roles.levels') }}</legend>
          <div class="mt-1 flex flex-wrap gap-4">
            <label v-for="level in LEVELS" :key="level" class="flex items-center gap-1.5"><input v-model="form[level]" type="checkbox">{{ t(`admin_pages.credit_roles.${level}`) }}</label>
          </div>
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.credit_roles.levels_help') }}</span>
        </fieldset>
        <label class="block">{{ t('admin_pages.credit_roles.sort_order') }}
          <input v-model.number="form.sort_order" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="flex items-center gap-1.5 self-end pb-2"><input v-model="form.is_active" type="checkbox">{{ t('admin_pages.credit_roles.active') }}</label>
        <label class="block sm:col-span-2">{{ t('admin_pages.optional_reason') }}
          <input v-model="form.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('common.save') }}</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="formOpen = false">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!shown.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('admin_pages.credit_roles.key') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.credit_roles.names') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.credit_roles.category') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.credit_roles.levels') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.credit_roles.usage') }}</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="role in shown" :key="role.key" :class="{ 'opacity-50': !role.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ role.key }}<span v-if="!role.is_active" class="ml-1 font-sans text-slate-500">（{{ t('admin_pages.credit_roles.inactive') }}）</span></td>
                <td class="px-3 py-3">{{ role.names['zh-Hans'] || role.names.en }} <span class="text-xs text-slate-500">{{ role.names.en }}</span></td>
                <td class="px-3 py-3 text-xs">{{ t(`admin_pages.credit_roles.categories.${role.category}`) }}</td>
                <td class="px-3 py-3 text-xs">{{ LEVELS.filter(level => role[level]).map(level => t(`admin_pages.credit_roles.${level}`)).join(' · ') }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ role.usage.album }} / {{ role.usage.track }}</td>
                <td class="px-3 py-3 text-right text-xs">
                  <button type="button" class="underline" @click="open(role)">{{ t('common.edit') }}</button>
                  <button type="button" class="ml-3 text-red-700 underline disabled:opacity-40" :disabled="used(role) > 0" :title="used(role) ? t('admin_pages.credit_roles.in_use') : undefined" @click="deleting = role">{{ t('common.delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.credit_roles.delete_title', { key: deleting?.key ?? '' })" :description="t('admin_pages.credit_roles.delete_help')" @confirm="remove" />
  </div>
</template>
