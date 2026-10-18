<script setup lang="ts">
import type { AdminDiscussionPost, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type Action = 'hide' | 'unhide' | 'delete' | 'restore' | 'purge'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError(t)
const canSeeIp = computed(() => hasPermission('users.manage'))
const filters = reactive({
  user: String(route.query.user ?? ''), category: String(route.query.category ?? ''), status: String(route.query.status ?? ''),
  topic_id: String(route.query.topic_id ?? ''), ip: String(route.query.ip ?? ''), search: String(route.query.search ?? ''),
})
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const query = computed(() => ({
  user: route.query.user || undefined, category: route.query.category || undefined, status: route.query.status || undefined,
  topic_id: route.query.topic_id || undefined, ip: route.query.ip || undefined, search: route.query.search || undefined, page: page.value,
}))
const apply = () => router.push({ query: Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])) })
const { data, pending, error, refresh } = await useAsyncData('admin-discussion-posts',
  () => $api<{ items: AdminDiscussionPost[], pagination: AdminPagination }>('/v1/admin/discussions/posts', { query: query.value }), { watch: [query] })

const busy = ref(false)
const notice = ref('')
const message = ref('')
const acting = ref<{ post: AdminDiscussionPost, action: Action } | null>(null)
const actOpen = computed({ get: () => acting.value !== null, set: (open) => { if (!open) acting.value = null } })
async function act(reason: string) {
  const current = acting.value
  if (!current) return
  busy.value = true
  message.value = ''
  const id = current.post.id
  const body = { reason: reason || undefined }
  try {
    if (current.action === 'hide') await $api(`/v1/admin/discussions/posts/${id}`, { method: 'PATCH', body: { status: 'hidden', ...body } })
    if (current.action === 'unhide') await $api(`/v1/admin/discussions/posts/${id}`, { method: 'PATCH', body: { status: 'visible', ...body } })
    if (current.action === 'delete') await $api(`/v1/admin/discussions/posts/${id}`, { method: 'DELETE', body })
    if (current.action === 'restore') await $api(`/v1/admin/discussions/posts/${id}/restore`, { method: 'POST', body })
    if (current.action === 'purge' && current.post.user) await $api(`/v1/admin/discussions/users/${current.post.user.id}/purge`, { method: 'POST', body })
    notice.value = t('admin_pages.saved')
    acting.value = null
    await refresh()
  }
  catch (failure) { message.value = localizeError(failure, 'admin_pages.action_failed') }
  finally { busy.value = false }
}
const tone: Record<string, string> = { visible: 'bg-emerald-50 text-emerald-700', hidden: 'bg-amber-50 text-amber-700', deleted: 'bg-rose-50 text-rose-700' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm'
useHead({ title: computed(() => t('admin_pages.discussions.posts.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.discussions.posts.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.discussions.posts.description') }}</p>
    </header>
    <form class="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3" @submit.prevent="apply">
      <input v-model="filters.search" type="search" maxlength="100" :class="[field, 'min-w-48 flex-1']" :placeholder="t('admin_pages.discussions.posts.search')">
      <input v-model="filters.user" maxlength="32" :class="[field, 'w-36']" :placeholder="t('admin_pages.discussions.posts.user')">
      <input v-model="filters.category" maxlength="60" :class="[field, 'w-32']" :placeholder="t('admin_pages.discussions.posts.category')">
      <input v-model="filters.topic_id" inputmode="numeric" :class="[field, 'w-28']" :placeholder="t('admin_pages.discussions.posts.topic_id')">
      <input v-if="canSeeIp" v-model="filters.ip" maxlength="45" :class="[field, 'w-36 font-mono']" placeholder="IP">
      <select v-model="filters.status" :class="field">
        <option value="">{{ t('admin_pages.all_statuses') }}</option>
        <option v-for="value in ['visible', 'hidden', 'deleted']" :key="value" :value="value">{{ t(`admin_pages.discussions.post_statuses.${value}`) }}</option>
      </select>
      <button type="submit" class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">{{ t('admin_pages.apply') }}</button>
    </form>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <ul class="space-y-2">
        <li v-for="post in data?.items" :key="post.id" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span class="rounded px-1.5 py-0.5 font-medium" :class="tone[post.status]">{{ t(`admin_pages.discussions.post_statuses.${post.status}`) }}</span>
                <NuxtLink v-if="post.topic" :to="`/discussions/${post.topic.id}?post=${post.id}`" class="font-semibold text-slate-800 underline decoration-slate-200 underline-offset-4">{{ post.topic.title }}</NuxtLink>
                <span>{{ post.floor ? `#${post.floor}` : t('admin_pages.discussions.reply_under', { floor: post.parent_floor }) }}</span>
                <span v-if="post.topic?.category">· {{ post.topic.category.name }}</span>
              </p>
              <p class="mt-1.5 line-clamp-3 whitespace-pre-line text-slate-700">{{ post.excerpt || post.raw }}</p>
              <p class="mt-1.5 text-xs text-slate-400">
                <NuxtLink v-if="post.user" :to="{ query: { user: post.user.username } }" class="hover:text-slate-700">{{ post.user.nickname || post.user.username }}</NuxtLink>
                · {{ time(post.created_at) }}<template v-if="post.edited_at"> · {{ t('admin_pages.discussions.posts.edited', { time: time(post.edited_at) }) }}</template>
                <template v-if="post.status_reason"> · {{ t('admin_pages.discussions.posts.reason', { reason: post.status_reason }) }}</template>
                <template v-if="canSeeIp && post.ip_address"> · <NuxtLink :to="{ query: { ip: post.ip_address } }" class="font-mono hover:text-slate-700">{{ post.ip_address }}</NuxtLink></template>
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-1.5 text-xs">
              <button v-if="post.status === 'visible'" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="acting = { post, action: 'hide' }">{{ t('admin_pages.discussions.actions.hide') }}</button>
              <button v-if="post.status === 'hidden'" type="button" class="rounded-lg border px-2.5 py-1.5" @click="acting = { post, action: 'unhide' }">{{ t('admin_pages.discussions.actions.unhide') }}</button>
              <button v-if="post.status !== 'deleted'" type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="acting = { post, action: 'delete' }">{{ t('admin_pages.discussions.actions.delete') }}</button>
              <button v-if="post.status !== 'visible'" type="button" class="rounded-lg border px-2.5 py-1.5" @click="acting = { post, action: 'restore' }">{{ t('admin_pages.discussions.actions.restore') }}</button>
              <button v-if="post.user" type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="acting = { post, action: 'purge' }">{{ t('admin_pages.discussions.actions.purge') }}</button>
            </div>
          </div>
        </li>
      </ul>
      <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>
    <AdminConfirmDialog
      v-model="actOpen" :busy="busy" :reason-required="acting ? ['hide', 'delete', 'purge'].includes(acting.action) : false"
      :title="acting ? t(`admin_pages.discussions.confirm.${acting.action}`, { name: acting.post.user?.nickname || acting.post.user?.username }) : ''"
      :description="acting ? t(`admin_pages.discussions.confirm_help.${acting.action}`) : ''" @confirm="act"
    />
  </div>
</template>
