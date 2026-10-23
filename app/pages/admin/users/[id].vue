<script setup lang="ts">
import type { AdminPagination, AdminRole, AdminUserActivity, AdminUserDetail, AdminUserMail } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission, user: actor } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const id = computed(() => String(route.params.id))
const { data: user, pending, error, refresh } = await useAsyncData(() => `admin-user-${id.value}`, () => $api<AdminUserDetail>(`/v1/admin/users/${id.value}`), { watch: [id] })
const canManage = computed(() => hasPermission('users.manage') && Boolean(user.value?.can_manage))
const profile = reactive({ username: '', nickname: '', email: '', birthday: '', avatar_url: '', banner_url: '', bio: '' })
const fields = [
  { key: 'username', type: 'text', required: true }, { key: 'nickname', type: 'text', required: true },
  { key: 'email', type: 'email', required: true }, { key: 'birthday', type: 'date', required: true },
  { key: 'avatar_url', type: 'url', required: false }, { key: 'banner_url', type: 'url', required: false },
] as const
watch(user, value => {
  if (value) for (const key of Object.keys(profile) as (keyof typeof profile)[]) profile[key] = value[key] ?? ''
}, { immediate: true })
const busy = ref(false)
const notice = ref('')
const failure = ref(false)
const showError = (error: unknown) => { failure.value = true; notice.value = (error as { status?: number }).status === 422 ? t('admin_pages.user_detail.invalid') : localizeError(error) }
const save = async () => {
  if (!canManage.value || busy.value) return
  busy.value = true
  notice.value = ''
  try {
    await $api(`/v1/admin/users/${id.value}`, { method: 'PUT', body: { ...profile, avatar_url: profile.avatar_url || null, banner_url: profile.banner_url || null, bio: profile.bio || null } })
    await refresh()
    failure.value = false; notice.value = t('admin_pages.saved')
  } catch (error) { showError(error) }
  finally { busy.value = false }
}
const types = ['revisions', 'reviews', 'articles', 'lyrics'] as const
type ActivityType = typeof types[number]
const activityType = computed(() => types.includes(String(route.query.type) as ActivityType) ? String(route.query.type) as ActivityType : 'revisions')
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: (value: number) => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const activityQuery = computed(() => ({ type: activityType.value, page: page.value }))
const { data: activity, pending: activityPending, error: activityError, refresh: refreshActivity } = await useAsyncData(() => `admin-user-activity-${id.value}`, () => $api<{ items: AdminUserActivity[], pagination: AdminPagination }>(`/v1/admin/users/${id.value}/activity`, { query: activityQuery.value }), { watch: [id, activityQuery] })
const activityLink = (item: AdminUserActivity) => {
  if (activityType.value === 'revisions') return hasPermission('revisions.view') ? `/admin/revisions/${item.id}` : null
  if (activityType.value === 'articles') return item.status === 'published' ? `/articles/${item.id}` : null
  if (activityType.value === 'lyrics') return item.work_id ? `/works/${item.work_id}` : null
  return item.album_id ? `/albums/${item.album_id}` : null
}
const selectType = (type: ActivityType) => router.push({ query: { ...route.query, type, page: undefined } })
const { data: roles, pending: rolesPending, error: rolesError, refresh: refreshRoles } = await useAsyncData('admin-user-role-options', () => hasPermission('users.assign-roles') ? $api<AdminRole[]>('/v1/admin/roles') : Promise.resolve([]))
const availableRoles = computed(() => (roles.value ?? []).filter(role => role.name !== 'staff' && (actor.value?.roles === 'staff' || (role.level < (actor.value?.role_level ?? 0) && role.permissions.every(hasPermission)))))
const dialog = ref(false)
const action = ref<'enable' | 'disable' | 'revoke' | 'send_reset' | 'clear_limit' | 'role'>('disable')
const selectedRole = ref('')
const limitIp = ref('')
const actionError = ref('')
const title = computed(() => action.value === 'role' ? t('admin_pages.users.assign_role') : t(`admin_pages.user_detail.${action.value}`))
const openAction = (value: typeof action.value) => {
  action.value = value; selectedRole.value = user.value?.roles ?? ''; limitIp.value = ''; notice.value = ''; actionError.value = ''; dialog.value = true
}
const confirmAction = async (reason: string) => {
  if (!canManage.value || busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    if (action.value === 'enable' || action.value === 'disable') await $api(`/v1/admin/users/${id.value}`, { method: 'PUT', body: { is_active: action.value === 'enable', reason } })
    else if (action.value === 'role') await $api(`/v1/admin/users/${id.value}/role`, { method: 'PUT', body: { role: selectedRole.value || null, reason: reason || null } })
    else {
      const paths = { revoke: 'revoke-tokens', send_reset: 'send-reset', clear_limit: 'clear-verification-limit' }
      await $api(`/v1/admin/users/${id.value}/${paths[action.value]}`, { method: 'POST', body: { reason, ...(action.value === 'clear_limit' && limitIp.value ? { ip: limitIp.value } : {}) } })
    }
    dialog.value = false
    await refresh()
    failure.value = false
    notice.value = t(action.value === 'send_reset' ? 'admin_pages.user_detail.reset_done' : action.value === 'clear_limit' ? 'admin_pages.user_detail.cleared' : action.value === 'revoke' ? 'admin_pages.user_detail.revoked' : 'admin_pages.saved')
  } catch (error) { actionError.value = (error as { status?: number }).status === 422 ? t('admin_pages.user_detail.invalid') : localizeError(error) }
  finally { busy.value = false }
}
const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
// Mail language, subscriptions and recent mail, for people who can read the send log.
const canSeeMail = computed(() => hasPermission('mail.logs'))
const { data: mail, pending: mailPending, error: mailLoadError, refresh: refreshMail } = await useAsyncData(() => `admin-user-mail-${id.value}`,
  () => canSeeMail.value ? $api<AdminUserMail>(`/v1/admin/users/${id.value}/mail`) : Promise.resolve(null), { watch: [id] })
const mailName = (names: Record<string, string | undefined>, key: string) => names['zh-Hans'] || names.en || key
useHead({ title: computed(() => t('admin_pages.user_detail.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header><NuxtLink to="/admin/users" class="text-sm text-slate-600 underline">{{ t('admin_pages.back_list') }}</NuxtLink><h1 class="mt-4 text-3xl font-bold">{{ t('admin_pages.user_detail.title') }}<span v-if="user" class="ml-3 text-slate-500">{{ user.nickname || user.username }}</span></h1></header>
    <p v-if="notice" role="status" class="rounded-lg p-4 text-sm" :class="failure ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'">{{ notice }}</p>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="user">
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="text-lg font-semibold">{{ t('admin_pages.user_detail.profile') }}</h2><p class="mt-2 text-sm text-slate-600">@{{ user.username }} · {{ user.roles || t('admin_pages.users.no_role') }} · {{ t(user.is_active ? 'admin_pages.users.active' : 'admin_pages.users.disabled') }}</p></div><dl class="flex gap-6 text-sm"><div><dt class="text-slate-500">{{ t('admin_pages.user_detail.contributions') }}</dt><dd class="mt-1 text-2xl font-semibold">{{ user.contributions_count }}</dd></div><div><dt class="text-slate-500">{{ t('admin_pages.user_detail.reviews') }}</dt><dd class="mt-1 text-2xl font-semibold">{{ user.reviews_count }}</dd></div></dl></div>
          <p v-if="!canManage" class="mt-4 text-sm text-amber-800">{{ t('admin_pages.user_detail.protected') }}</p>
          <p v-if="user.role_names.length > 1" class="mt-4 text-sm text-amber-800">{{ t('admin_pages.user_detail.legacy_roles') }}</p>
          <form class="mt-6 space-y-5" @submit.prevent="save">
            <div class="grid gap-4 md:grid-cols-2"><label v-for="field in fields" :key="field.key" class="block text-sm">{{ t(`admin_pages.user_detail.${field.key}`) }}<input v-model="profile[field.key]" :type="field.type" :required="field.required" :disabled="!canManage || busy" :maxlength="field.key === 'username' ? 32 : field.type === 'url' ? 2048 : 255" class="mt-2 w-full rounded-lg border p-2.5 disabled:bg-slate-50"></label></div>
            <label class="block text-sm">{{ t('admin_pages.user_detail.bio') }}<textarea v-model="profile.bio" :disabled="!canManage || busy" rows="3" maxlength="10000" class="mt-2 w-full rounded-lg border p-2.5 disabled:bg-slate-50" /></label>
            <button v-if="canManage" type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{{ t('admin_pages.user_detail.save_profile') }}</button>
          </form>
          <div v-if="canManage" class="mt-6 flex flex-wrap gap-3 border-t pt-5 text-sm">
            <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="openAction(user.is_active ? 'disable' : 'enable')">{{ t(user.is_active ? 'admin_pages.user_detail.disable' : 'admin_pages.user_detail.enable') }}</button>
            <button v-if="hasPermission('users.assign-roles')" type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="openAction('role')">{{ t('admin_pages.users.assign_role') }}</button>
            <button v-for="operation in (['revoke', 'send_reset', 'clear_limit'] as const)" :key="operation" type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="openAction(operation)">{{ t(`admin_pages.user_detail.${operation}`) }}</button>
          </div>
        </section>
        <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">{{ t('admin_pages.user_detail.activity') }}</h2>
            <NuxtLink v-if="hasPermission('content.manage')" :to="`/admin/images?uploaded_by=${user.id}`" class="text-sm underline">{{ t('admin_pages.user_detail.images') }}</NuxtLink>
          </div>
          <div class="my-4 flex flex-wrap gap-2"><button v-for="type in types" :key="type" type="button" :aria-pressed="activityType === type" class="rounded-lg border px-4 py-2 text-sm" :class="activityType === type ? 'bg-slate-900 text-white' : ''" @click="selectType(type)">{{ t(`admin_pages.user_detail.activity_${type}`) }}</button></div>
          <AdminListState :pending="activityPending" :error="activityError" :empty="!activity?.items.length" @retry="refreshActivity()">
            <ul class="divide-y divide-slate-100"><li v-for="item in activity?.items" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><div><NuxtLink v-if="activityLink(item)" :to="activityLink(item)!" class="font-medium underline">{{ item.title || `#${item.id}` }}</NuxtLink><span v-else class="font-medium">{{ item.title || `#${item.id}` }}</span><span class="ml-3 text-xs text-slate-500">{{ item.status === 'draft' ? t('admin_pages.user_detail.draft') : item.status === 'published' ? t('admin_pages.user_detail.published') : item.status }} {{ item.language }}</span></div><time class="text-xs text-slate-500">{{ time(item.created_at) }}</time></li></ul>
            <CommonPagination v-model:page="page" :total-pages="activity?.pagination.last_page || 1" :disabled="activityPending" />
          </AdminListState>
        </section>
        <section v-if="canSeeMail" class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">{{ t('admin_pages.mail.user.title') }}</h2>
            <NuxtLink :to="`/admin/mail/logs?user_id=${user.id}`" class="text-sm underline">{{ t('admin_pages.mail.user.all_logs') }}</NuxtLink>
          </div>
          <AdminListState :pending="mailPending" :error="mailLoadError" @retry="refreshMail()">
            <template v-if="mail">
              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt class="text-slate-500">{{ t('admin_pages.mail.user.locale') }}</dt><dd class="mt-1">{{ t(`admin_pages.mail.locales.${mail.mail_locale}`) }}</dd></div>
                <div><dt class="text-slate-500">{{ t('admin_pages.mail.user.opted_out') }}</dt><dd class="mt-1">{{ mail.mail_opted_out_at ? time(mail.mail_opted_out_at) : t('admin_pages.mail.user.never') }}</dd></div>
                <div>
                  <dt class="text-slate-500">{{ t('admin_pages.mail.user.suppression') }}</dt>
                  <dd class="mt-1" :class="mail.suppression ? 'text-red-700' : ''">{{ mail.suppression ? `${t(`admin_pages.mail.suppression_reasons.${mail.suppression.reason}`)} · ${time(mail.suppression.created_at)}` : t('admin_pages.mail.user.not_suppressed') }}</dd>
                </div>
              </dl>
              <h3 class="mt-5 text-sm font-medium">{{ t('admin_pages.mail.user.subscriptions') }}</h3>
              <ul class="mt-2 flex flex-wrap gap-2 text-xs">
                <li v-for="subscription in mail.mail_subscriptions" :key="subscription.key" class="rounded-full px-3 py-1" :class="subscription.is_subscribed ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                  {{ mailName(subscription.names, subscription.key) }} · {{ subscription.is_required ? t('admin_pages.mail.user.required') : subscription.is_subscribed ? t('admin_pages.mail.user.subscribed') : t('admin_pages.mail.user.unsubscribed') }}
                </li>
              </ul>
              <h3 class="mt-5 text-sm font-medium">{{ t('admin_pages.mail.user.recent') }}</h3>
              <p v-if="!mail.mail_logs.length" class="mt-2 text-sm text-slate-500">{{ t('common.no_records') }}</p>
              <ul v-else class="mt-2 divide-y divide-slate-100 text-sm">
                <li v-for="log in mail.mail_logs" :key="log.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span class="font-medium">{{ log.campaign?.title || log.template?.name || log.subject || '—' }}</span>
                  <span class="text-xs text-slate-500">{{ t(`admin_pages.mail.log_status.${log.status}`) }}<template v-if="log.delivery_status"> · {{ t(`admin_pages.mail.delivery_status.${log.delivery_status}`) }}</template></span>
                  <time class="ml-auto text-xs text-slate-500">{{ time(log.created_at) }}</time>
                </li>
              </ul>
            </template>
          </AdminListState>
        </section>
        <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="text-lg font-semibold">{{ t('admin_pages.user_detail.sessions') }} <span class="text-sm text-slate-500">({{ user.login_sessions_total }})</span></h2><p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.user_detail.sessions_help') }}</p>
          <p v-if="!user.login_sessions.length" class="mt-4 text-sm text-slate-500">{{ t('admin_pages.user_detail.no_sessions') }}</p>
          <div v-else class="mt-4 max-h-72 overflow-auto"><table class="w-full text-left text-sm"><thead class="text-slate-500"><tr><th class="py-2">{{ t('admin_pages.user_detail.created_at') }}</th><th class="py-2">{{ t('admin_pages.user_detail.last_used_at') }}</th></tr></thead><tbody><tr v-for="(session, index) in user.login_sessions" :key="index" class="border-t"><td class="py-3">{{ time(session.created_at) }}</td><td class="py-3">{{ time(session.last_used_at) }}</td></tr></tbody></table></div>
        </section>
      </template>
    </AdminListState>
    <AdminConfirmDialog v-model="dialog" :busy="busy" :title="title" :reason-required="action !== 'role'" :confirm-disabled="action === 'role' && (Boolean(rolesError) || rolesPending)" @confirm="confirmAction">
      <p class="mt-3 text-sm text-slate-600">{{ t('admin_pages.user_detail.confirm_action', { name: user?.nickname || user?.username }) }}</p>
      <template v-if="action === 'role'"><AdminListState :pending="rolesPending" :error="rolesError" @retry="refreshRoles()"><label class="mt-4 block text-sm">{{ t('admin_pages.users.role') }}<select v-model="selectedRole" :disabled="busy" class="mt-2 w-full rounded-lg border p-2"><option value="">{{ t('admin_pages.users.no_role') }}</option><option v-for="role in availableRoles" :key="role.id" :value="role.name">{{ role.name }}</option></select></label></AdminListState></template>
      <template v-if="action === 'clear_limit'"><p class="mt-3 text-xs text-slate-500">{{ t('admin_pages.user_detail.clear_help') }}</p><label class="mt-3 block text-sm">{{ t('admin_pages.user_detail.optional_ip') }}<input v-model="limitIp" :disabled="busy" maxlength="45" class="mt-2 w-full rounded-lg border p-2"></label></template>
      <p v-if="action === 'send_reset'" class="mt-3 text-xs text-slate-500">{{ t('admin_pages.user_detail.reset_help') }}</p>
      <p v-if="actionError" role="alert" class="mt-3 text-sm text-red-700">{{ actionError }}</p>
    </AdminConfirmDialog>
  </div>
</template>
