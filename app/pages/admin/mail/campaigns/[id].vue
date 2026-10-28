<script setup lang="ts">
import type { AdminMailAudience, AdminMailAudienceStats, AdminMailCampaign, AdminMailCategory, AdminMailContents, AdminMailTemplate, AdminMailTemplateSummary } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { confirm } = useConfirm()
const { mailError, fieldErrors, errorName, localeName, categoryName, time } = useAdminMail()
const editorFieldLabels: Record<string, string> = { 'subject': '标题', 'body': '正文' }
const mailCampaignCounterLabels: Record<string, string> = {
  recipients: '收件人',
  sent: '已发送',
  failed: '失败',
  skipped: '跳过',
  pending: '等待中',
  delivered: '已送达',
  bounced: '退信',
  complained: '投诉',
  unsubscribed: '因此退订',
}
const id = computed(() => Number(route.params.id))
const { data: campaign, pending, error, refresh } = await useAsyncData(() => `admin-mail-campaign-${id.value}`,
  () => $api<AdminMailCampaign>(`/v1/admin/mail/campaigns/${id.value}`), { watch: [id] })
const { data: categories } = await useAsyncData('admin-mail-categories-all',
  () => $api<{ mail_categories: AdminMailCategory[] }>('/v1/admin/mail/categories').then(response => response.mail_categories))
const { data: templates } = await useAsyncData('admin-mail-group-templates',
  () => $api<{ mail_templates: AdminMailTemplateSummary[] }>('/v1/admin/mail/templates').then(response => response.mail_templates.filter(template => template.kind === 'campaign')))

const editable = computed(() => campaign.value?.status === 'draft' || campaign.value?.status === 'scheduled')
// The API sends `[]` for an empty JSON object; copies keep the form apart from the loaded data.
const plain = <T extends object>(value: unknown): T => (value && typeof value === 'object' && !Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : {}) as T

// The form is a copy of the saved campaign; saving or reloading replaces it.
const form = reactive({ title: '', mail_category_id: null as number | null, mail_template_id: null as number | null, contents: {} as AdminMailContents, audience: {} as AdminMailAudience })
const snapshot = () => JSON.stringify([form.title, form.mail_category_id, form.mail_template_id, form.contents, form.audience])
const saved = ref('')
watch(campaign, (value) => {
  if (!value) return
  Object.assign(form, {
    title: value.title, mail_category_id: value.mail_category?.id ?? null, mail_template_id: value.mail_template?.id ?? null,
    contents: plain<AdminMailContents>(value.contents), audience: plain<AdminMailAudience>(value.audience),
  })
  saved.value = snapshot()
}, { immediate: true })
const dirty = computed(() => editable.value && saved.value !== snapshot())
const categoryOptions = computed(() => (categories.value ?? []).filter(category => category.is_active || category.id === form.mail_category_id))
const target = computed(() => form.mail_category_id ? { mail_category_id: form.mail_category_id } : null)

const busy = ref(false)
const notice = ref('')
const message = ref('')
const errors = ref<Record<string, string[]>>({})
const save = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  errors.value = {}
  try {
    await $api(`/v1/admin/mail/campaigns/${id.value}`, { method: 'PUT', body: {
      title: form.title.trim(), mail_category_id: form.mail_category_id, mail_template_id: form.mail_template_id, contents: form.contents, audience: form.audience,
    } })
    await refresh()
    notice.value = '已保存'
    return true
  } catch (failure) {
    message.value = mailError(failure)
    errors.value = fieldErrors(failure)
    return false
  } finally {
    busy.value = false
  }
}

// Starting from a group mail template copies its text into the campaign.
const templateId = ref<number | null>(null)
const loadTemplate = async () => {
  if (!templateId.value || !await confirm({ title: '载入模板', description: '模板的内容会替换当前所有语言的标题和正文，未保存的修改会丢失。' })) return
  try {
    const template = await $api<AdminMailTemplate>(`/v1/admin/mail/templates/${templateId.value}`)
    form.contents = plain<AdminMailContents>(template.contents)
    form.mail_template_id = template.id
    if (template.mail_category?.id && categoryOptions.value.some(category => category.id === template.mail_category?.id)) form.mail_category_id = template.mail_category.id
    notice.value = `已载入模板「${template.name}」，记得保存。`
  } catch (failure) {
    message.value = mailError(failure)
  }
}

const problemLabel = (key: string) => {
  const [, locale, field] = key.split('.')
  if (key.startsWith('contents.') && locale) return field ? `${localeName(locale)} · ${editorFieldLabels[field] ?? field}` : localeName(locale)
  return key === 'mail_category_id' ? '类型' : key
}
const problems = computed(() => Object.entries(campaign.value?.problems ?? {}))
const audienceErrors = computed(() => Object.entries(errors.value).filter(([key]) => key.startsWith('audience')))

// Sending: the operator types the recipient count they are shown, then it goes now or at a set time.
const sendOpen = ref(false)
const sendStats = ref<AdminMailAudienceStats | null>(null)
const sendMode = ref<'now' | 'later'>('now')
const scheduleAt = ref('')
const sendMessage = ref('')
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const countRecipients = async () => {
  sendStats.value = null
  try {
    sendStats.value = await $api<AdminMailAudienceStats>('/v1/admin/mail/audience', { method: 'POST', body: { mail_category_id: form.mail_category_id, audience: form.audience } })
  } catch (failure) {
    sendMessage.value = mailError(failure)
  }
}
const openSend = async () => {
  if (dirty.value && !await save()) return
  sendMessage.value = ''
  sendMode.value = campaign.value?.status === 'scheduled' ? 'later' : 'now'
  scheduleAt.value = toLocalInput(campaign.value?.scheduled_at)
  sendOpen.value = true
  await countRecipients()
}
const sendBlocked = computed(() => !sendStats.value || sendStats.value.total === 0 || (sendMode.value === 'later' && !scheduleAt.value))
const send = async () => {
  if (sendBlocked.value || busy.value || !sendStats.value) return
  busy.value = true
  sendMessage.value = ''
  try {
    await $api(`/v1/admin/mail/campaigns/${id.value}/send`, { method: 'POST', body: {
      confirm_count: sendStats.value.total, scheduled_at: sendMode.value === 'later' ? new Date(scheduleAt.value).toISOString() : null,
    } })
    sendOpen.value = false
    notice.value = (sendMode.value === 'later' ? '已定时，到时间后会自动开始发送。' : '已开始发送。')
    await refresh()
  } catch (failure) {
    if (errorName(failure) === 'MAIL_AUDIENCE_CHANGED') {
      const stats = (failure as { details?: { details?: AdminMailAudienceStats } }).details?.details
      if (stats) sendStats.value = stats
    }
    errors.value = fieldErrors(failure)
    sendMessage.value = mailError(failure)
  } finally {
    busy.value = false
  }
}

async function run(action: () => Promise<unknown>, done: string) {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = done
    await refresh()
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const unschedule = async () => {
  if (await confirm({ title: '取消定时', description: '取消后回到草稿，可以继续编辑，之后再重新发送或定时。' })) {
    await run(() => $api(`/v1/admin/mail/campaigns/${id.value}/cancel`, { method: 'POST' }), '已取消定时，回到草稿。')
  }
}
const stopOpen = ref(false)
const stop = async (reason: string) => {
  await run(() => $api(`/v1/admin/mail/campaigns/${id.value}/cancel`, { method: 'POST', body: { reason } }), '已停止发送。')
  stopOpen.value = false
}
const resume = () => run(() => $api(`/v1/admin/mail/campaigns/${id.value}/resume`, { method: 'POST' }), '已重新开始发送。')
const duplicate = async () => {
  busy.value = true
  try {
    const copy = await $api<AdminMailCampaign>(`/v1/admin/mail/campaigns/${id.value}/duplicate`, { method: 'POST' })
    await router.push(`/admin/mail/campaigns/${copy.id}`)
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const remove = async () => {
  if (!await confirm({ title: `删除草稿「${campaign.value?.title ?? ''}」？`, description: '草稿删除后无法恢复。' })) return
  busy.value = true
  try {
    await $api(`/v1/admin/mail/campaigns/${id.value}`, { method: 'DELETE' })
    await router.push('/admin/mail/campaigns')
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}

// While it sends, the counters follow every few seconds.
let poller: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  watch(() => campaign.value?.status, (status) => {
    clearInterval(poller)
    if (status === 'sending') poller = setInterval(() => { void refresh() }, 5000)
  }, { immediate: true })
})
onBeforeUnmount(() => clearInterval(poller))

const counters = computed(() => {
  const value = campaign.value
  if (!value) return []
  return ([
    ['recipients', value.recipients_count], ['sent', value.sent_count], ['failed', value.failed_count], ['skipped', value.skipped_count],
    ['pending', value.pending_count], ['delivered', value.delivered_count], ['bounced', value.bounced_count], ['complained', value.complained_count],
    ['unsubscribed', value.unsubscribed_count],
  ] as const).map(([key, count]) => ({ key, count }))
})
const progress = computed(() => {
  const value = campaign.value
  return value && value.recipients_count ? Math.round(100 * (value.sent_count + value.failed_count + value.skipped_count) / value.recipients_count) : 0
})
const audienceSummary = computed(() => {
  const audience = form.audience
  const parts = [
    audience.roles?.length ? `角色：${audience.roles.join('、')}` : '',
    audience.locales?.length ? `语言：${audience.locales.map(localeName).join('、')}` : '',
    audience.active_within_days ? `最近 ${audience.active_within_days} 天登录过` : '',
    audience.joined_from || audience.joined_to ? `注册于 ${audience.joined_from || '…'} 至 ${audience.joined_to || '…'}` : '',
  ].filter(Boolean)
  return parts.length ? parts.join('；') : '所有订阅者'
})
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50'
useHead({ title: computed(() => campaign.value?.title || '群发') })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <NuxtLink to="/admin/mail/campaigns" class="text-sm text-slate-600 underline">返回列表</NuxtLink>
      <div v-if="campaign" class="mt-4 flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-bold">{{ campaign.title }}</h1>
        <AdminMailCampaignStatus :status="campaign.status" />
        <div class="ml-auto flex flex-wrap gap-2 text-sm">
          <UiButton v-if="!editable" :to="`/admin/mail/logs?campaign_id=${campaign.id}`" size="sm">发送记录</UiButton>
          <UiButton size="sm" :disabled="busy" @click="duplicate">复制为新草稿</UiButton>
          <UiButton v-if="campaign.status === 'draft'" variant="danger-soft" size="sm" :disabled="busy" @click="remove">删除</UiButton>
        </div>
      </div>
    </header>

    <p v-if="notice" role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{{ notice }}</p>
    <p v-if="message" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="campaign">
        <p v-if="!campaign.configured" role="alert" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">服务器还没有配置群发（缺少 MAIL_BULK_MAILER 或 APP_KEY），现在只能编辑和预览，不能发送。</p>
        <div v-if="campaign.last_error" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p class="font-medium">发信服务出错</p>
          <p class="mt-1 break-all font-mono text-xs">{{ campaign.last_error }}</p>
          <UiButton v-if="campaign.status === 'sending'" variant="primary" size="sm" :disabled="busy" class="mt-3" @click="resume">继续发送</UiButton>
        </div>

        <!-- Draft or scheduled: everything can still change. -->
        <template v-if="editable">
          <div v-if="campaign.status === 'scheduled'" class="flex flex-wrap items-center gap-3 rounded-lg bg-sky-50 p-4 text-sm text-sky-900">
            <span>定时于 {{ time(campaign.scheduled_at) }} 发送</span>
            <UiButton size="sm" :disabled="busy" @click="unschedule">取消定时</UiButton>
          </div>
          <div v-if="problems.length" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <p class="font-medium">发送前还需要解决这些问题：</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li v-for="[key, messages] in problems" :key="key">{{ problemLabel(key) }}：{{ messages.join(' ') }}</li>
            </ul>
          </div>

          <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div class="grid gap-4 text-sm md:grid-cols-2">
              <label class="block">名称
                <input v-model="form.title" required maxlength="200" :disabled="busy" :class="[field, 'mt-1 w-full']">
                <span v-for="titleError in errors.title ?? []" :key="titleError" class="mt-1 block text-xs text-red-700">{{ titleError }}</span>
              </label>
              <label class="block">类型
                <select v-model="form.mail_category_id" :disabled="busy" :class="[field, 'mt-1 w-full']">
                  <option v-for="category in categoryOptions" :key="category.id" :value="category.id">{{ categoryName(category) }}<template v-if="category.is_required">（必收）</template><template v-if="!category.is_active">（已停用）</template></option>
                </select>
                <span class="mt-1 block text-xs text-slate-500">决定谁能收到：订阅了这个类型的用户。必收类型发给所有正常账号。</span>
              </label>
            </div>
            <div v-if="templates?.length" class="flex flex-wrap items-end gap-2 text-sm">
              <label class="block">从模板开始
                <select v-model="templateId" :class="[field, 'mt-1 block min-w-56']">
                  <option :value="null">—</option>
                  <option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name }}</option>
                </select>
              </label>
              <UiButton :disabled="!templateId || busy" @click="loadTemplate">载入模板</UiButton>
              <span v-if="campaign.mail_template" class="text-xs text-slate-500">基于模板「{{ campaign.mail_template.name }}」</span>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">内容</h2>
            <AdminMailContentEditor v-model="form.contents" :target="target" :variables="campaign.variables" :errors="errors" :disabled="busy" />
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">收件人</h2>
            <AdminMailAudienceEditor v-model="form.audience" :category-id="form.mail_category_id" :disabled="busy" />
            <p v-for="[key, messages] in audienceErrors" :key="key" class="mt-2 text-xs text-red-700">{{ messages.join(' ') }}</p>
          </section>

          <AdminMailTestSend :target="target" :contents="form.contents" :disabled="busy" @errors="errors = $event" />

          <div class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 py-4 text-sm backdrop-blur">
            <UiButton :disabled="busy || !dirty" @click="save">保存</UiButton>
            <UiButton variant="primary" :disabled="busy || !campaign.configured || !form.mail_category_id" @click="openSend">
              {{ campaign.status === 'scheduled' ? '重新定时或立即发送…' : '发送…' }}
            </UiButton>
            <span v-if="dirty" class="text-xs text-amber-700">有未保存的修改</span>
          </div>
        </template>

        <!-- Sending, sent or cancelled: what happened. -->
        <template v-else>
          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">发送情况</h2>
              <UiButton v-if="campaign.status === 'sending'" variant="danger-soft" size="sm" :disabled="busy" @click="stopOpen = true">停止发送</UiButton>
            </div>
            <div v-if="campaign.recipients_count" class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${progress}%` }" />
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div v-for="counter in counters" :key="counter.key" class="rounded-lg bg-slate-50 p-3">
                <dt class="text-xs text-slate-500">{{ mailCampaignCounterLabels[counter.key] }}</dt>
                <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ counter.count }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-xs text-slate-500">已送达、退信和投诉来自发信服务的回调或退信邮箱；没有接入时一直是 0。</p>
            <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt class="inline text-slate-500">类型：</dt><dd class="inline">{{ categoryName(campaign.mail_category) }}</dd></div>
              <div><dt class="inline text-slate-500">收件人：</dt><dd class="inline">{{ audienceSummary }}</dd></div>
              <div><dt class="inline text-slate-500">开始时间：</dt><dd class="inline">{{ time(campaign.started_at) }}<template v-if="campaign.sent_by">（{{ campaign.sent_by.username }}）</template></dd></div>
              <div><dt class="inline text-slate-500">完成时间：</dt><dd class="inline">{{ time(campaign.finished_at) }}</dd></div>
            </dl>
          </section>
          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">内容</h2>
            <AdminMailContentEditor v-model="form.contents" :target="target" :variables="campaign.variables" disabled />
          </section>
        </template>
      </template>
    </AdminListState>

    <AdminConfirmDialog
      v-model="sendOpen" :busy="busy" title="确认发送" :confirm-phrase="sendStats ? String(sendStats.total) : ''"
      :confirm-disabled="sendBlocked" :confirm-text="sendMode === 'later' ? '确认定时' : '确认发送'" @confirm="send"
    >
      <div class="mt-3 space-y-3 text-sm">
        <p v-if="!sendStats" class="text-slate-500">统计中…</p>
        <template v-else>
          <p class="text-base">预计 {{ sendStats.total }} 人收到</p>
          <p v-if="Object.keys(sendStats.by_locale).length" class="text-xs text-slate-600">{{ Object.entries(sendStats.by_locale).map(([locale, total]) => `${localeName(locale)} ${total}`).join(' · ') }}</p>
          <p class="text-xs text-slate-500">已排除：禁用账号 {{ sendStats.excluded.inactive }} 人，未订阅 {{ sendStats.excluded.unsubscribed }} 人，退信名单 {{ sendStats.excluded.suppressed }} 人</p>
        </template>
        <fieldset class="space-y-2">
          <label class="flex items-center gap-2"><input v-model="sendMode" type="radio" value="now">立即发送</label>
          <label class="flex items-center gap-2"><input v-model="sendMode" type="radio" value="later">定时发送</label>
          <input v-if="sendMode === 'later'" v-model="scheduleAt" type="datetime-local" aria-label="定时发送" :class="[field, 'w-full']">
        </fieldset>
        <p class="text-xs text-slate-500">开始发送时收件人名单就固定了，之后注册的用户不会收到；每封发出前还会再检查一次订阅状态。</p>
        <p v-if="sendMessage" role="alert" class="text-red-700">{{ sendMessage }}</p>
      </div>
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="stopOpen" :busy="busy" reason-required title="停止发送" description="停止后，还没发出的邮件都不会再发，已经发出的不受影响。这一步不能撤销。" @confirm="stop" />
  </div>
</template>
