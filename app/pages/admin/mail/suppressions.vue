<script setup lang="ts">
import type { AdminMailSuppression, AdminMailSuppressionReason, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { confirm } = useConfirm()
const { t, mailError, time } = useAdminMail()
const reasons: AdminMailSuppressionReason[] = ['hard_bounce', 'soft_bounce', 'complaint', 'manual']
const page = useQueryPage()
const filters = reactive({ search: String(route.query.search ?? ''), reason: String(route.query.reason ?? '') })
watch(() => route.query, (query) => { filters.search = String(query.search ?? ''); filters.reason = String(query.reason ?? '') })
const applyFilters = () => router.push({ query: { search: filters.search.trim() || undefined, reason: filters.reason || undefined } })
const query = computed(() => ({ page: page.value, search: route.query.search || undefined, reason: route.query.reason || undefined }))
const { data, pending, error, refresh } = await useAsyncData('admin-mail-suppressions',
  () => $api<{ mail_suppressions: AdminMailSuppression[], pagination: AdminPagination }>('/v1/admin/mail/suppressions', { query: query.value }), { watch: [query] })

const form = reactive({ email: '', note: '' })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const add = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api('/v1/admin/mail/suppressions', { method: 'POST', body: { email: form.email.trim(), note: form.note.trim() || null } })
    notice.value = t('admin_pages.mail.suppressions.added', { email: form.email.trim() })
    Object.assign(form, { email: '', note: '' })
    await refresh()
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const remove = async (suppression: AdminMailSuppression) => {
  if (!await confirm({ title: t('admin_pages.mail.suppressions.remove_title', { email: suppression.email }), description: t('admin_pages.mail.suppressions.remove_help') })) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/mail/suppressions/${suppression.id}`, { method: 'DELETE' })
    notice.value = t('admin_pages.mail.suppressions.removed', { email: suppression.email })
    await refresh()
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => t('admin_pages.mail.suppressions.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.mail.suppressions.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.mail.suppressions.description') }}</p>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ t('admin_pages.mail.suppressions.add') }}</h2>
      <form class="mt-3 flex flex-wrap items-end gap-2 text-sm" @submit.prevent="add">
        <label class="block">{{ t('admin_pages.mail.suppressions.email') }}
          <input v-model="form.email" type="email" required maxlength="255" :class="[field, 'mt-1 block w-72']">
        </label>
        <label class="block grow">{{ t('admin_pages.mail.suppressions.note') }}
          <input v-model="form.note" maxlength="500" :class="[field, 'mt-1 block w-full']">
        </label>
        <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('common.add') }}</button>
      </form>
    </section>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" maxlength="255" :placeholder="t('admin_pages.mail.suppressions.search')" :aria-label="t('admin_pages.mail.suppressions.search')" :class="[field, 'w-64']">
        <select v-model="filters.reason" :aria-label="t('admin_pages.mail.suppressions.reason')" :class="field">
          <option value="">{{ t('admin_pages.mail.suppressions.all_reasons') }}</option>
          <option v-for="reason in reasons" :key="reason" :value="reason">{{ t(`admin_pages.mail.suppression_reasons.${reason}`) }}</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!data?.mail_suppressions.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="suppression in data?.mail_suppressions" :key="suppression.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
            <span class="font-mono">{{ suppression.email }}</span>
            <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{{ t(`admin_pages.mail.suppression_reasons.${suppression.reason}`) }}</span>
            <span v-if="suppression.note" class="max-w-md truncate text-xs text-slate-500" :title="suppression.note">{{ suppression.note }}</span>
            <span class="ml-auto text-xs text-slate-500">{{ time(suppression.created_at) }}<template v-if="suppression.created_by"> · {{ suppression.created_by.username }}</template></span>
            <button type="button" :disabled="busy" class="text-xs text-red-700 underline disabled:opacity-40" @click="remove(suppression)">{{ t('admin_pages.mail.suppressions.remove') }}</button>
          </li>
        </ul>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
