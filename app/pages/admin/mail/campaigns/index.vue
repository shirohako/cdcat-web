<script setup lang="ts">
import type { AdminMailCampaign, AdminMailCampaignStatus, AdminMailCampaignSummary, AdminMailCategory, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t, mailError, categoryName, time } = useAdminMail()
const statuses: AdminMailCampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'cancelled']
const page = useQueryPage()
const filters = reactive({ search: String(route.query.search ?? ''), status: String(route.query.status ?? '') })
watch(() => route.query, (query) => { filters.search = String(query.search ?? ''); filters.status = String(query.status ?? '') })
const applyFilters = () => router.push({ query: { search: filters.search.trim() || undefined, status: filters.status || undefined } })
const query = computed(() => ({ page: page.value, search: route.query.search || undefined, status: route.query.status || undefined }))
const { data, pending, error, refresh } = await useAsyncData('admin-mail-campaigns',
  () => $api<{ mail_campaigns: AdminMailCampaignSummary[], pagination: AdminPagination, configured: boolean }>('/v1/admin/mail/campaigns', { query: query.value }), { watch: [query] })

// New campaigns start as a draft with a title and a category; everything else is edited on the campaign page.
const { data: categories } = await useAsyncData('admin-mail-campaign-categories',
  () => $api<{ mail_categories: AdminMailCategory[] }>('/v1/admin/mail/categories').then(response => response.mail_categories.filter(category => category.is_active)))
const creating = ref(false)
const form = reactive({ title: '', mail_category_id: null as number | null })
const busy = ref(false)
const message = ref('')
const openCreate = () => {
  Object.assign(form, { title: '', mail_category_id: categories.value?.[0]?.id ?? null })
  message.value = ''
  creating.value = true
}
const create = async () => {
  if (busy.value || !form.mail_category_id) return
  busy.value = true
  message.value = ''
  try {
    const campaign = await $api<AdminMailCampaign>('/v1/admin/mail/campaigns', { method: 'POST', body: { title: form.title.trim(), mail_category_id: form.mail_category_id } })
    await router.push(`/admin/mail/campaigns/${campaign.id}`)
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => t('admin_pages.mail.campaigns.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.mail.campaigns.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.mail.campaigns.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="openCreate">{{ t('admin_pages.mail.campaigns.create') }}</button>
    </header>

    <p v-if="data && !data.configured" role="alert" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{{ t('admin_pages.mail.campaigns.not_configured') }}</p>

    <section v-if="creating" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ t('admin_pages.mail.campaigns.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="create">
        <label class="block">{{ t('admin_pages.mail.campaigns.campaign_title') }}
          <input v-model="form.title" required maxlength="200" :class="[field, 'mt-1 w-full']">
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.mail.campaigns.title_help') }}</span>
        </label>
        <label class="block">{{ t('admin_pages.mail.campaigns.category') }}
          <select v-model="form.mail_category_id" required :class="[field, 'mt-1 w-full']">
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ categoryName(category) }}<template v-if="category.is_required">（{{ t('admin_pages.mail.categories.required') }}）</template></option>
          </select>
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy || !form.mail_category_id" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('admin_pages.mail.campaigns.create_draft') }}</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="creating = false">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </section>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" maxlength="100" :placeholder="t('admin_pages.mail.campaigns.search')" :aria-label="t('admin_pages.mail.campaigns.search')" :class="[field, 'w-56']">
        <select v-model="filters.status" :aria-label="t('admin_pages.mail.campaigns.status')" :class="field">
          <option value="">{{ t('admin_pages.all_statuses') }}</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ t(`admin_pages.mail.campaign_status.${status}`) }}</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!data?.mail_campaigns.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('admin_pages.mail.campaigns.campaign_title') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.campaigns.category') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.campaigns.status') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.campaigns.progress') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.campaigns.when') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.mail.campaigns.created_by') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="campaign in data?.mail_campaigns" :key="campaign.id">
                <td class="px-4 py-3">
                  <NuxtLink :to="`/admin/mail/campaigns/${campaign.id}`" class="font-medium underline">{{ campaign.title }}</NuxtLink>
                  <p v-if="campaign.last_error" class="mt-1 max-w-sm truncate text-xs text-red-700" :title="campaign.last_error">{{ campaign.last_error }}</p>
                </td>
                <td class="px-3 py-3">{{ categoryName(campaign.mail_category) }}</td>
                <td class="px-3 py-3"><AdminMailCampaignStatus :status="campaign.status" /></td>
                <td class="px-3 py-3 text-xs tabular-nums text-slate-600">
                  <template v-if="campaign.status === 'draft' || campaign.status === 'scheduled'">—</template>
                  <template v-else>{{ t('admin_pages.mail.campaigns.progress_value', { sent: campaign.sent_count, total: campaign.recipients_count, failed: campaign.failed_count, skipped: campaign.skipped_count }) }}</template>
                </td>
                <td class="px-3 py-3 text-xs text-slate-600">
                  <template v-if="campaign.status === 'scheduled'">{{ t('admin_pages.mail.campaigns.scheduled_for', { time: time(campaign.scheduled_at) }) }}</template>
                  <template v-else-if="campaign.started_at">{{ time(campaign.started_at) }}</template>
                  <template v-else>{{ t('admin_pages.mail.campaigns.updated', { time: time(campaign.updated_at) }) }}</template>
                </td>
                <td class="px-3 py-3 text-xs text-slate-600">{{ campaign.created_by?.username ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
