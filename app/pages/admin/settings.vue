<script setup lang="ts">
import type { AdminSiteSettings } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const { data, pending, error, refresh } = await useAsyncData('admin-settings', () => $api<AdminSiteSettings>('/v1/admin/settings'))

// datetime-local works in the viewer's local time; the API stores UTC.
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const form = reactive({ registration_open: true, content: '', level: 'info' as 'info' | 'warning', enabled: false, ends_at: '', reason: '' })
watch(data, (value) => {
  if (!value) return
  const { registration_open, announcement } = value.settings
  Object.assign(form, { registration_open, content: announcement.content, level: announcement.level, enabled: announcement.enabled, ends_at: toLocalInput(announcement.ends_at), reason: '' })
}, { immediate: true })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const save = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    data.value = await $api<AdminSiteSettings>('/v1/admin/settings', { method: 'PUT', body: {
      registration_open: form.registration_open,
      announcement: { content: form.content, level: form.level, enabled: form.enabled, ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null },
      reason: form.reason || null,
    } })
    notice.value = t('admin_pages.saved')
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
const updated = (key: string) => {
  const meta = data.value?.updated[key]
  if (!meta?.updated_at) return ''
  const time = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(meta.updated_at))
  return t('admin_pages.settings.updated', { time, name: meta.updated_by?.nickname || meta.updated_by?.username || '—' })
}
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => t('admin_pages.settings.title')) })
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.settings.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.settings.description') }}</p>
    </header>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <form v-if="data" class="space-y-5 text-sm" @submit.prevent="save">
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">{{ t('admin_pages.settings.registration') }}</h2>
          <label class="mt-3 flex items-center gap-2"><input v-model="form.registration_open" type="checkbox">{{ t('admin_pages.settings.registration_open') }}</label>
          <p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.settings.registration_help') }}</p>
          <p v-if="updated('registration_open')" class="mt-1 text-xs text-slate-400">{{ updated('registration_open') }}</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">{{ t('admin_pages.settings.announcement') }}</h2>
          <label class="mt-3 flex items-center gap-2"><input v-model="form.enabled" type="checkbox">{{ t('admin_pages.settings.announcement_enabled') }}</label>
          <label class="mt-3 block">{{ t('admin_pages.settings.announcement_content') }}<textarea v-model="form.content" maxlength="2000" rows="3" :class="input" /></label>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">{{ t('admin_pages.settings.level') }}<select v-model="form.level" :class="input"><option value="info">{{ t('admin_pages.settings.level_info') }}</option><option value="warning">{{ t('admin_pages.settings.level_warning') }}</option></select></label>
            <label class="block">{{ t('admin_pages.settings.ends_at') }}<input v-model="form.ends_at" type="datetime-local" :class="input"></label>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.settings.version_help', { version: data.settings.announcement.version }) }}</p>
          <p v-if="updated('announcement')" class="mt-1 text-xs text-slate-400">{{ updated('announcement') }}</p>
          <div v-if="form.enabled && form.content.trim()" class="mt-4 rounded-lg border px-4 py-2.5" :class="form.level === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'">
            <p class="text-xs opacity-70">{{ t('admin_pages.settings.preview') }}</p>
            <p class="whitespace-pre-line">{{ form.content }}</p>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ data.public.announcement ? t('admin_pages.settings.live') : t('admin_pages.settings.not_live') }}</p>
        </section>
        <label class="block">{{ t('admin_pages.optional_reason') }}<input v-model="form.reason" maxlength="2000" :class="input"></label>
        <div class="flex items-center justify-end gap-3">
          <p v-if="notice" role="status" class="mr-auto text-emerald-700">{{ notice }}</p>
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </AdminListState>
  </div>
</template>
