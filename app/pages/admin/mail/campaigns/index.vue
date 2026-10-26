<script setup lang="ts">
import type { AdminMailCampaign, AdminMailCampaignStatus, AdminMailCampaignSummary, AdminMailCategory, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { mailError, categoryName, time } = useAdminMail()
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
useHead({ title: '群发' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">群发</h1>
        <p class="mt-2 text-sm text-slate-600">按邮件类型给订阅的用户发邮件。除重要通知外，每封邮件都带退订链接；收件人收到的是自己邮件语言的版本。</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="openCreate">新建群发</button>
    </header>

    <p v-if="data && !data.configured" role="alert" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">服务器还没有配置群发（缺少 MAIL_BULK_MAILER 或 APP_KEY），现在只能编辑和预览，不能发送。</p>

    <section v-if="creating" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">新建群发</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="create">
        <label class="block">名称
          <input v-model="form.title" required maxlength="200" :class="[field, 'mt-1 w-full']">
          <span class="mt-1 block text-xs text-slate-500">只在后台显示，收件人看不到。</span>
        </label>
        <label class="block">类型
          <select v-model="form.mail_category_id" required :class="[field, 'mt-1 w-full']">
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ categoryName(category) }}<template v-if="category.is_required">（必收）</template></option>
          </select>
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy || !form.mail_category_id" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">创建草稿</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="creating = false">取消</button>
        </div>
      </form>
    </section>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" maxlength="100" placeholder="搜索名称" aria-label="搜索名称" :class="[field, 'w-56']">
        <select v-model="filters.status" aria-label="状态" :class="field">
          <option value="">全部状态</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ mailCampaignStatusLabels[status] }}</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
      </form>
    </AdminFilterBar>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!data?.mail_campaigns.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">名称</th>
                <th class="px-3 py-3">类型</th>
                <th class="px-3 py-3">状态</th>
                <th class="px-3 py-3">进度</th>
                <th class="px-3 py-3">时间</th>
                <th class="px-3 py-3">创建人</th>
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
                  <template v-else>已发 {{ campaign.sent_count }} / {{ campaign.recipients_count }}，失败 {{ campaign.failed_count }}，跳过 {{ campaign.skipped_count }}</template>
                </td>
                <td class="px-3 py-3 text-xs text-slate-600">
                  <template v-if="campaign.status === 'scheduled'">定时于 {{ time(campaign.scheduled_at) }} 发送</template>
                  <template v-else-if="campaign.started_at">{{ time(campaign.started_at) }}</template>
                  <template v-else>更新于 {{ time(campaign.updated_at) }}</template>
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
