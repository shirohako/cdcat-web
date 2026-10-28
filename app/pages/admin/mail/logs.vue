<script setup lang="ts">
import type { AdminMailDeliveryStatus, AdminMailLog, AdminMailLogStatus, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { localeName } = useAdminMail()
const linkedLabels: Record<string, string> = { 'campaign_id': '群发', 'template_id': '模板', 'user_id': '用户' }
const mailBounceTypeLabels: Record<string, string> = { hard: '硬退信', soft: '软退信' }
const mailSkipReasonLabels: Record<string, string> = { unsubscribed: '已退订', inactive: '账号禁用', suppressed: '在退信名单' }
const statuses: AdminMailLogStatus[] = ['pending', 'sent', 'failed', 'skipped', 'cancelled']
const deliveryStatuses: (AdminMailDeliveryStatus | 'none')[] = ['delivered', 'delayed', 'bounced', 'complained', 'none']
// Typed in the filter bar; campaign, template and user arrive from links elsewhere and show as chips.
const filterKeys = ['search', 'status', 'delivery_status', 'from', 'to'] as const
const linkKeys = ['campaign_id', 'template_id', 'user_id'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = useQueryPage()
const linked = computed(() => linkKeys.filter(key => route.query[key]).map(key => ({ key, value: String(route.query[key]) })))
const applyFilters = () => router.push({ query: {
  ...Object.fromEntries(linkKeys.map(key => [key, route.query[key] || undefined])),
  ...Object.fromEntries(filterKeys.map(key => [key, filters[key].trim() || undefined])),
} })
const dropLink = (key: string) => router.push({ query: { ...route.query, [key]: undefined, page: undefined } })
const query = computed(() => ({ page: page.value, ...Object.fromEntries([...filterKeys, ...linkKeys].map(key => [key, route.query[key] || undefined])) }))
const { data, pending, error, refresh } = await useAsyncData('admin-mail-logs',
  () => $api<{ mail_logs: AdminMailLog[], pagination: AdminPagination }>('/v1/admin/mail/logs', { query: query.value }), { watch: [query] })

const expanded = ref<number | null>(null)
const canManage = computed(() => hasPermission('mail.manage'))
const statusClass: Record<AdminMailLogStatus, string> = {
  pending: 'text-amber-700', sent: 'text-emerald-700', failed: 'text-red-700', skipped: 'text-slate-500', cancelled: 'text-slate-500',
}
const deliveryClass: Record<AdminMailDeliveryStatus, string> = {
  delayed: 'text-amber-700', delivered: 'text-emerald-700', bounced: 'text-red-700', complained: 'text-red-700',
}
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: '发送记录' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">发送记录</h1>
      <p class="mt-2 text-sm text-slate-600">每一封发出的邮件都有一条记录，系统邮件和群发都在这里。记录里不保存正文。</p>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" maxlength="255" placeholder="搜索邮箱或用户名" aria-label="搜索邮箱或用户名" :class="[field, 'w-60']">
        <select v-model="filters.status" aria-label="状态" :class="field">
          <option value="">全部状态</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ mailLogStatusLabels[status] }}</option>
        </select>
        <select v-model="filters.delivery_status" aria-label="投递" :class="field">
          <option value="">全部投递状态</option>
          <option v-for="status in deliveryStatuses" :key="status" :value="status">{{ mailDeliveryStatusLabels[status] }}</option>
        </select>
        <label class="flex items-center gap-1">从<input v-model="filters.from" type="date" :class="[field, 'px-2']"></label>
        <label class="flex items-center gap-1">至<input v-model="filters.to" type="date" :class="[field, 'px-2']"></label>
        <UiButton type="submit" variant="primary">应用</UiButton>
      </form>
      <div v-if="linked.length" class="flex flex-wrap gap-2 text-xs">
        <button v-for="link in linked" :key="link.key" type="button" class="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1" aria-label="去掉这个筛选" @click="dropLink(link.key)">
          {{ linkedLabels[link.key] }} #{{ link.value }}<Icon name="lucide:x" class="size-3" />
        </button>
      </div>
    </AdminFilterBar>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!data?.mail_logs.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-240 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">时间</th>
                <th class="px-3 py-3">收件人</th>
                <th class="px-3 py-3">邮件</th>
                <th class="px-3 py-3">语言</th>
                <th class="px-3 py-3">状态</th>
                <th class="px-3 py-3">投递</th>
                <th class="px-3 py-3">错误</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template v-for="log in data?.mail_logs" :key="log.id">
                <tr class="cursor-pointer hover:bg-slate-50" :aria-expanded="expanded === log.id" @click="expanded = expanded === log.id ? null : log.id">
                  <td class="px-4 py-3 text-xs tabular-nums text-slate-600">{{ time(log.created_at) }}</td>
                  <td class="px-3 py-3">
                    <span class="font-mono text-xs">{{ log.email }}</span>
                    <NuxtLink v-if="log.user" :to="`/admin/users/${log.user.id}`" class="ml-2 text-xs underline" @click.stop>@{{ log.user.username }}</NuxtLink>
                  </td>
                  <td class="px-3 py-3 text-xs">
                    <NuxtLink v-if="log.campaign && canManage" :to="`/admin/mail/campaigns/${log.campaign.id}`" class="underline" @click.stop>{{ log.campaign.title }}</NuxtLink>
                    <span v-else-if="log.campaign">{{ log.campaign.title }}</span>
                    <NuxtLink v-else-if="log.template && canManage" :to="`/admin/mail/templates/${log.template.id}`" class="underline" @click.stop>{{ log.template.name }}</NuxtLink>
                    <span v-else-if="log.template">{{ log.template.name }}</span>
                    <span v-else class="text-slate-500">{{ log.subject || '—' }}</span>
                  </td>
                  <td class="px-3 py-3 text-xs">{{ localeName(log.locale) }}</td>
                  <td class="px-3 py-3 text-xs" :class="statusClass[log.status]">
                    {{ mailLogStatusLabels[log.status] }}<template v-if="log.skip_reason">（{{ mailSkipReasonLabels[log.skip_reason] }}）</template>
                  </td>
                  <td class="px-3 py-3 text-xs">
                    <span v-if="log.delivery_status" :class="deliveryClass[log.delivery_status]">{{ mailDeliveryStatusLabels[log.delivery_status] }}<template v-if="log.bounce_type">（{{ mailBounceTypeLabels[log.bounce_type] }}）</template></span>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                  <td class="max-w-xs truncate px-3 py-3 text-xs text-red-700" :title="log.error ?? undefined">{{ log.error }}</td>
                </tr>
                <tr v-if="expanded === log.id" class="bg-slate-50">
                  <td colspan="7" class="px-4 py-3">
                    <dl class="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                      <div><dt class="inline text-slate-500">标题：</dt><dd class="inline">{{ log.subject || '—' }}</dd></div>
                      <div><dt class="inline text-slate-500">Mailer：</dt><dd class="inline font-mono">{{ log.mailer || '—' }}</dd></div>
                      <div><dt class="inline text-slate-500">交给发信服务的时间：</dt><dd class="inline">{{ time(log.sent_at) }}</dd></div>
                      <div><dt class="inline text-slate-500">Message-ID：</dt><dd class="inline break-all font-mono">{{ log.message_id || '—' }}</dd></div>
                      <div><dt class="inline text-slate-500">投递状态更新时间：</dt><dd class="inline">{{ time(log.delivery_updated_at) }}</dd></div>
                      <div class="sm:col-span-2"><dt class="inline text-slate-500">对方服务器的回应：</dt><dd class="inline break-all font-mono">{{ log.delivery_detail || '—' }}</dd></div>
                      <div v-if="log.error" class="sm:col-span-2"><dt class="inline text-slate-500">错误：</dt><dd class="inline break-all font-mono text-red-700">{{ log.error }}</dd></div>
                    </dl>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
    <p class="text-xs text-slate-500">发送记录保留 180 天。「已发送」只表示发信服务已经接收，之后的情况看投递状态。</p>
  </div>
</template>
