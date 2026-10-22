<script setup lang="ts">
import type { AdminMailAudience, AdminMailAudienceStats, AdminMailCampaign, AdminMailCategory, AdminMailContents, AdminMailTemplate, AdminMailTemplateSummary } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { confirm } = useConfirm()
const { t, mailError, fieldErrors, errorName, localeName, categoryName, time } = useAdminMail()
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
    notice.value = t('admin_pages.saved')
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
  if (!templateId.value || !await confirm({ title: t('admin_pages.mail.campaigns.load_template'), description: t('admin_pages.mail.campaigns.load_template_help') })) return
  try {
    const template = await $api<AdminMailTemplate>(`/v1/admin/mail/templates/${templateId.value}`)
    form.contents = plain<AdminMailContents>(template.contents)
    form.mail_template_id = template.id
    if (template.mail_category?.id && categoryOptions.value.some(category => category.id === template.mail_category?.id)) form.mail_category_id = template.mail_category.id
    notice.value = t('admin_pages.mail.campaigns.template_loaded', { name: template.name })
  } catch (failure) {
    message.value = mailError(failure)
  }
}

const problemLabel = (key: string) => {
  const [, locale, field] = key.split('.')
  if (key.startsWith('contents.') && locale) return field ? `${localeName(locale)} · ${t(`admin_pages.mail.editor.${field}`)}` : localeName(locale)
  return key === 'mail_category_id' ? t('admin_pages.mail.campaigns.category') : key
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
    notice.value = t(sendMode.value === 'later' ? 'admin_pages.mail.campaigns.scheduled_done' : 'admin_pages.mail.campaigns.sending_done')
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
  if (await confirm({ title: t('admin_pages.mail.campaigns.unschedule'), description: t('admin_pages.mail.campaigns.unschedule_help') })) {
    await run(() => $api(`/v1/admin/mail/campaigns/${id.value}/cancel`, { method: 'POST' }), t('admin_pages.mail.campaigns.unscheduled_done'))
  }
}
const stopOpen = ref(false)
const stop = async (reason: string) => {
  await run(() => $api(`/v1/admin/mail/campaigns/${id.value}/cancel`, { method: 'POST', body: { reason } }), t('admin_pages.mail.campaigns.cancelled_done'))
  stopOpen.value = false
}
const resume = () => run(() => $api(`/v1/admin/mail/campaigns/${id.value}/resume`, { method: 'POST' }), t('admin_pages.mail.campaigns.resumed_done'))
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
  if (!await confirm({ title: t('admin_pages.mail.campaigns.delete_title', { title: campaign.value?.title ?? '' }), description: t('admin_pages.mail.campaigns.delete_help') })) return
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
    audience.roles?.length ? t('admin_pages.mail.audience.summary_roles', { roles: audience.roles.join('、') }) : '',
    audience.locales?.length ? t('admin_pages.mail.audience.summary_locales', { locales: audience.locales.map(localeName).join('、') }) : '',
    audience.active_within_days ? t('admin_pages.mail.audience.summary_active', { days: audience.active_within_days }) : '',
    audience.joined_from || audience.joined_to ? t('admin_pages.mail.audience.summary_joined', { from: audience.joined_from || '…', to: audience.joined_to || '…' }) : '',
  ].filter(Boolean)
  return parts.length ? parts.join('；') : t('admin_pages.mail.audience.summary_all')
})
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50'
useHead({ title: computed(() => campaign.value?.title || t('admin_pages.mail.campaigns.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <NuxtLink to="/admin/mail/campaigns" class="text-sm text-slate-600 underline">{{ t('admin_pages.back_list') }}</NuxtLink>
      <div v-if="campaign" class="mt-4 flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-bold">{{ campaign.title }}</h1>
        <AdminMailCampaignStatus :status="campaign.status" />
        <div class="ml-auto flex flex-wrap gap-2 text-sm">
          <NuxtLink v-if="!editable" :to="`/admin/mail/logs?campaign_id=${campaign.id}`" class="rounded-lg border px-3 py-2">{{ t('admin_pages.mail.campaigns.view_logs') }}</NuxtLink>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-40" @click="duplicate">{{ t('admin_pages.mail.campaigns.duplicate') }}</button>
          <button v-if="campaign.status === 'draft'" type="button" :disabled="busy" class="rounded-lg border border-red-200 px-3 py-2 text-red-700 disabled:opacity-40" @click="remove">{{ t('common.delete') }}</button>
        </div>
      </div>
    </header>

    <p v-if="notice" role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{{ notice }}</p>
    <p v-if="message" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="campaign">
        <p v-if="!campaign.configured" role="alert" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{{ t('admin_pages.mail.campaigns.not_configured') }}</p>
        <div v-if="campaign.last_error" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p class="font-medium">{{ t('admin_pages.mail.campaigns.last_error') }}</p>
          <p class="mt-1 break-all font-mono text-xs">{{ campaign.last_error }}</p>
          <button v-if="campaign.status === 'sending'" type="button" :disabled="busy" class="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40" @click="resume">{{ t('admin_pages.mail.campaigns.resume') }}</button>
        </div>

        <!-- Draft or scheduled: everything can still change. -->
        <template v-if="editable">
          <div v-if="campaign.status === 'scheduled'" class="flex flex-wrap items-center gap-3 rounded-lg bg-sky-50 p-4 text-sm text-sky-900">
            <span>{{ t('admin_pages.mail.campaigns.scheduled_for', { time: time(campaign.scheduled_at) }) }}</span>
            <button type="button" :disabled="busy" class="rounded-lg border border-sky-300 bg-white px-3 py-1.5 disabled:opacity-40" @click="unschedule">{{ t('admin_pages.mail.campaigns.unschedule') }}</button>
          </div>
          <div v-if="problems.length" class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <p class="font-medium">{{ t('admin_pages.mail.campaigns.problems') }}</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li v-for="[key, messages] in problems" :key="key">{{ problemLabel(key) }}：{{ messages.join(' ') }}</li>
            </ul>
          </div>

          <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div class="grid gap-4 text-sm md:grid-cols-2">
              <label class="block">{{ t('admin_pages.mail.campaigns.campaign_title') }}
                <input v-model="form.title" required maxlength="200" :disabled="busy" :class="[field, 'mt-1 w-full']">
                <span v-for="titleError in errors.title ?? []" :key="titleError" class="mt-1 block text-xs text-red-700">{{ titleError }}</span>
              </label>
              <label class="block">{{ t('admin_pages.mail.campaigns.category') }}
                <select v-model="form.mail_category_id" :disabled="busy" :class="[field, 'mt-1 w-full']">
                  <option v-for="category in categoryOptions" :key="category.id" :value="category.id">{{ categoryName(category) }}<template v-if="category.is_required">（{{ t('admin_pages.mail.categories.required') }}）</template><template v-if="!category.is_active">（{{ t('admin_pages.mail.categories.inactive') }}）</template></option>
                </select>
                <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.mail.campaigns.category_help') }}</span>
              </label>
            </div>
            <div v-if="templates?.length" class="flex flex-wrap items-end gap-2 text-sm">
              <label class="block">{{ t('admin_pages.mail.campaigns.from_template') }}
                <select v-model="templateId" :class="[field, 'mt-1 block min-w-56']">
                  <option :value="null">—</option>
                  <option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name }}</option>
                </select>
              </label>
              <button type="button" :disabled="!templateId || busy" class="rounded-lg border px-3 py-2 disabled:opacity-40" @click="loadTemplate">{{ t('admin_pages.mail.campaigns.load_template') }}</button>
              <span v-if="campaign.mail_template" class="text-xs text-slate-500">{{ t('admin_pages.mail.campaigns.based_on', { name: campaign.mail_template.name }) }}</span>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">{{ t('admin_pages.mail.campaigns.contents') }}</h2>
            <AdminMailContentEditor v-model="form.contents" :target="target" :variables="campaign.variables" :errors="errors" :disabled="busy" />
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">{{ t('admin_pages.mail.campaigns.audience') }}</h2>
            <AdminMailAudienceEditor v-model="form.audience" :category-id="form.mail_category_id" :disabled="busy" />
            <p v-for="[key, messages] in audienceErrors" :key="key" class="mt-2 text-xs text-red-700">{{ messages.join(' ') }}</p>
          </section>

          <AdminMailTestSend :target="target" :contents="form.contents" :disabled="busy" @errors="errors = $event" />

          <div class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 py-4 text-sm backdrop-blur">
            <button type="button" :disabled="busy || !dirty" class="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40" @click="save">{{ t('common.save') }}</button>
            <button type="button" :disabled="busy || !campaign.configured || !form.mail_category_id" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" @click="openSend">
              {{ campaign.status === 'scheduled' ? t('admin_pages.mail.campaigns.reschedule') : t('admin_pages.mail.campaigns.send') }}
            </button>
            <span v-if="dirty" class="text-xs text-amber-700">{{ t('admin_pages.mail.campaigns.unsaved') }}</span>
          </div>
        </template>

        <!-- Sending, sent or cancelled: what happened. -->
        <template v-else>
          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">{{ t('admin_pages.mail.campaigns.results') }}</h2>
              <button v-if="campaign.status === 'sending'" type="button" :disabled="busy" class="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 disabled:opacity-40" @click="stopOpen = true">{{ t('admin_pages.mail.campaigns.stop') }}</button>
            </div>
            <div v-if="campaign.recipients_count" class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${progress}%` }" />
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div v-for="counter in counters" :key="counter.key" class="rounded-lg bg-slate-50 p-3">
                <dt class="text-xs text-slate-500">{{ t(`admin_pages.mail.campaigns.counters.${counter.key}`) }}</dt>
                <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ counter.count }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-xs text-slate-500">{{ t('admin_pages.mail.campaigns.delivery_help') }}</p>
            <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt class="inline text-slate-500">{{ t('admin_pages.mail.campaigns.category') }}：</dt><dd class="inline">{{ categoryName(campaign.mail_category) }}</dd></div>
              <div><dt class="inline text-slate-500">{{ t('admin_pages.mail.campaigns.audience') }}：</dt><dd class="inline">{{ audienceSummary }}</dd></div>
              <div><dt class="inline text-slate-500">{{ t('admin_pages.mail.campaigns.started_at') }}：</dt><dd class="inline">{{ time(campaign.started_at) }}<template v-if="campaign.sent_by">（{{ campaign.sent_by.username }}）</template></dd></div>
              <div><dt class="inline text-slate-500">{{ t('admin_pages.mail.campaigns.finished_at') }}：</dt><dd class="inline">{{ time(campaign.finished_at) }}</dd></div>
            </dl>
          </section>
          <section class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-semibold">{{ t('admin_pages.mail.campaigns.contents') }}</h2>
            <AdminMailContentEditor v-model="form.contents" :target="target" :variables="campaign.variables" disabled />
          </section>
        </template>
      </template>
    </AdminListState>

    <AdminConfirmDialog
      v-model="sendOpen" :busy="busy" :title="t('admin_pages.mail.campaigns.send_title')" :confirm-phrase="sendStats ? String(sendStats.total) : ''"
      :confirm-disabled="sendBlocked" :confirm-text="sendMode === 'later' ? t('admin_pages.mail.campaigns.schedule_confirm') : t('admin_pages.mail.campaigns.send_confirm')" @confirm="send"
    >
      <div class="mt-3 space-y-3 text-sm">
        <p v-if="!sendStats" class="text-slate-500">{{ t('admin_pages.mail.audience.counting') }}</p>
        <template v-else>
          <p class="text-base">{{ t('admin_pages.mail.audience.total', { count: sendStats.total }) }}</p>
          <p v-if="Object.keys(sendStats.by_locale).length" class="text-xs text-slate-600">{{ Object.entries(sendStats.by_locale).map(([locale, total]) => `${localeName(locale)} ${total}`).join(' · ') }}</p>
          <p class="text-xs text-slate-500">{{ t('admin_pages.mail.audience.excluded', { ...sendStats.excluded }) }}</p>
        </template>
        <fieldset class="space-y-2">
          <label class="flex items-center gap-2"><input v-model="sendMode" type="radio" value="now">{{ t('admin_pages.mail.campaigns.send_now') }}</label>
          <label class="flex items-center gap-2"><input v-model="sendMode" type="radio" value="later">{{ t('admin_pages.mail.campaigns.send_later') }}</label>
          <input v-if="sendMode === 'later'" v-model="scheduleAt" type="datetime-local" :aria-label="t('admin_pages.mail.campaigns.send_later')" :class="[field, 'w-full']">
        </fieldset>
        <p class="text-xs text-slate-500">{{ t('admin_pages.mail.campaigns.send_help') }}</p>
        <p v-if="sendMessage" role="alert" class="text-red-700">{{ sendMessage }}</p>
      </div>
    </AdminConfirmDialog>
    <AdminConfirmDialog v-model="stopOpen" :busy="busy" reason-required :title="t('admin_pages.mail.campaigns.stop')" :description="t('admin_pages.mail.campaigns.stop_help')" @confirm="stop" />
  </div>
</template>
