<script setup lang="ts">
import type { AdminPagination, AdminWordFilter } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError(t)
const actionFilter = ref<'' | 'block' | 'flag'>('')
const { data, pending, error, refresh } = await useAsyncData('admin-word-filters',
  () => $api<{ items: AdminWordFilter[], pagination: AdminPagination }>('/v1/admin/word-filters', { query: { action: actionFilter.value || undefined, per_page: 100 } }), { watch: [actionFilter] })

const form = reactive({ word: '', action: 'block' as 'block' | 'flag', note: '' })
const busy = ref(false)
const message = ref('')
const notice = ref('')
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
const add = () => run(async () => {
  await $api('/v1/admin/word-filters', { method: 'POST', body: { word: form.word, action: form.action, note: form.note.trim() || null } })
  Object.assign(form, { word: '', note: '' })
}, t('admin_pages.saved'))
const toggle = (filter: AdminWordFilter) => run(() => $api(`/v1/admin/word-filters/${filter.id}`, { method: 'PUT', body: { action: filter.action === 'block' ? 'flag' : 'block' } }), t('admin_pages.saved'))
const remove = (filter: AdminWordFilter) => run(() => $api(`/v1/admin/word-filters/${filter.id}`, { method: 'DELETE' }), t('admin_pages.word_filters.deleted'))
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => t('admin_pages.word_filters.title')) })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.word_filters.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.word_filters.description') }}</p>
    </header>
    <form class="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm" @submit.prevent="add">
      <label class="block">{{ t('admin_pages.word_filters.word') }}<input v-model="form.word" required maxlength="100" :class="[field, 'mt-1 block w-56']"></label>
      <label class="block">{{ t('admin_pages.word_filters.action') }}<select v-model="form.action" :class="[field, 'mt-1 block']"><option value="block">{{ t('admin_pages.word_filters.actions.block') }}</option><option value="flag">{{ t('admin_pages.word_filters.actions.flag') }}</option></select></label>
      <label class="block flex-1">{{ t('admin_pages.word_filters.note') }}<input v-model="form.note" maxlength="500" :class="[field, 'mt-1 block w-full']"></label>
      <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ t('admin_pages.word_filters.add') }}</button>
    </form>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <section class="rounded-xl border border-slate-200 bg-white">
      <div class="flex gap-1 border-b border-slate-100 p-2 text-sm">
        <button v-for="value in (['', 'block', 'flag'] as const)" :key="value" type="button" class="rounded-md px-2.5 py-1" :class="actionFilter === value ? 'bg-slate-900 text-white' : 'text-slate-500'" @click="actionFilter = value">
          {{ value ? t(`admin_pages.word_filters.actions.${value}`) : t('admin_pages.word_filters.all') }}
        </button>
      </div>
      <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
        <table class="w-full text-left text-sm">
          <tbody class="divide-y divide-slate-100">
            <tr v-for="filter in data?.items" :key="filter.id">
              <td class="px-4 py-2 font-mono">{{ filter.word }}</td>
              <td class="px-4 py-2"><span class="rounded-full border px-2 py-0.5 text-xs" :class="filter.action === 'block' ? 'border-rose-200 text-rose-700' : 'border-amber-200 text-amber-700'">{{ t(`admin_pages.word_filters.actions.${filter.action}`) }}</span></td>
              <td class="px-4 py-2 text-xs text-slate-500">{{ filter.note }}</td>
              <td class="space-x-2 whitespace-nowrap px-4 py-2 text-right text-xs">
                <button type="button" class="underline" :disabled="busy" @click="toggle(filter)">{{ t('admin_pages.word_filters.switch') }}</button>
                <button type="button" class="text-red-700 underline" :disabled="busy" @click="remove(filter)">{{ t('common.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
    </section>
  </div>
</template>
