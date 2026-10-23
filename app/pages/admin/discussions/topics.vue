<script setup lang="ts">
import type { AdminDiscussionCategory, AdminDiscussionTopic, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

/**
 * Topics as a whole: pin, feature, lock, move, fold (by folding #1) and delete. Single posts and
 * replies are handled on the post finder (/admin/discussions/posts).
 */
type Action = 'pin' | 'feature' | 'unfeature' | 'lock' | 'unlock' | 'move' | 'hide' | 'unhide' | 'delete'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError(t)

const filterKeys = ['search', 'user', 'category', 'status', 'flag', 'sort'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))
const apply = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const { data, pending, error, refresh } = await useAsyncData('admin-discussion-topics',
  () => $api<{ items: AdminDiscussionTopic[], pagination: AdminPagination }>('/v1/admin/discussions/topics', { query: query.value }), { watch: [query] })
// Categories for the filter and the move dialog: each parent followed by its children.
const { data: categoryData } = await useAsyncData('admin-discussion-topic-categories',
  () => $api<{ items: AdminDiscussionCategory[] }>('/v1/admin/discussions/categories').then(result => result.items))
const categories = computed(() => {
  const all = categoryData.value ?? []
  return all.filter(category => !category.parent_id).flatMap(parent => [parent, ...all.filter(child => child.parent_id === parent.id)])
})

const busy = ref(false)
const notice = ref('')
const message = ref('')
const acting = ref<{ topic: AdminDiscussionTopic, action: Action } | null>(null)
const actOpen = computed({ get: () => acting.value !== null, set: (open) => { if (!open) acting.value = null } })
const pinScope = ref<'none' | 'category' | 'global'>('none')
const moveTo = ref<number | null>(null)

function start(topic: AdminDiscussionTopic, action: Action) {
  pinScope.value = topic.pinned_scope ?? 'category'
  moveTo.value = topic.category_id
  acting.value = { topic, action }
}

async function act(reason: string) {
  const current = acting.value
  if (!current) return
  busy.value = true
  message.value = ''
  const { topic, action } = current
  const topicUrl = `/v1/admin/discussions/topics/${topic.id}`
  const extra = { reason: reason || undefined }
  try {
    if (action === 'pin') await $api(topicUrl, { method: 'PATCH', body: { pinned_scope: pinScope.value === 'none' ? null : pinScope.value, ...extra } })
    if (action === 'feature' || action === 'unfeature') await $api(topicUrl, { method: 'PATCH', body: { featured: action === 'feature', ...extra } })
    if (action === 'lock' || action === 'unlock') await $api(topicUrl, { method: 'PATCH', body: { locked: action === 'lock', ...extra } })
    if (action === 'move') await $api(topicUrl, { method: 'PATCH', body: { category_id: moveTo.value, ...extra } })
    if ((action === 'hide' || action === 'unhide') && topic.first_post_id) {
      await $api(`/v1/admin/discussions/posts/${topic.first_post_id}`, { method: 'PATCH', body: { status: action === 'hide' ? 'hidden' : 'visible', ...extra } })
    }
    if (action === 'delete') await $api(topicUrl, { method: 'DELETE', body: extra })
    notice.value = t('admin_pages.saved')
    acting.value = null
    await refresh()
  }
  catch (failure) { message.value = localizeError(failure, 'admin_pages.action_failed') }
  finally { busy.value = false }
}

const tone: Record<string, string> = { visible: 'bg-emerald-50 text-emerald-700', hidden: 'bg-amber-50 text-amber-700' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm'
const button = 'rounded-lg border px-2.5 py-1.5'
useHead({ title: computed(() => t('admin_pages.discussions.topics.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.discussions.topics.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.discussions.topics.description') }}</p>
    </header>
    <form class="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3" @submit.prevent="apply">
      <input v-model="filters.search" type="search" maxlength="100" :class="[field, 'min-w-48 flex-1']" :placeholder="t('admin_pages.discussions.topics.search')">
      <input v-model="filters.user" maxlength="32" :class="[field, 'w-36']" :placeholder="t('admin_pages.discussions.posts.user')">
      <select v-model="filters.category" :class="field">
        <option value="">{{ t('admin_pages.discussions.topics.all_categories') }}</option>
        <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.parent_id ? '└ ' : '' }}{{ category.name }}</option>
      </select>
      <select v-model="filters.status" :class="field">
        <option value="">{{ t('admin_pages.all_statuses') }}</option>
        <option v-for="value in ['visible', 'hidden']" :key="value" :value="value">{{ t(`admin_pages.discussions.post_statuses.${value}`) }}</option>
      </select>
      <select v-model="filters.flag" :class="field">
        <option value="">{{ t('admin_pages.discussions.topics.any_flag') }}</option>
        <option v-for="value in ['pinned', 'featured', 'locked', 'article']" :key="value" :value="value">{{ t(`admin_pages.discussions.topics.flags.${value}`) }}</option>
      </select>
      <select v-model="filters.sort" :class="field">
        <option v-for="value in ['created', 'last_posted', 'posts', 'views']" :key="value" :value="value === 'created' ? '' : value">{{ t(`admin_pages.discussions.topics.sorts.${value}`) }}</option>
      </select>
      <button type="submit" class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">{{ t('admin_pages.apply') }}</button>
    </form>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <p class="mb-2 text-sm text-slate-500">{{ t('common.items_total', { count: data?.pagination.total ?? 0 }) }}</p>
      <ul class="space-y-2">
        <li v-for="topic in data?.items" :key="topic.id" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span class="rounded px-1.5 py-0.5 font-medium" :class="tone[topic.status]">{{ t(`admin_pages.discussions.post_statuses.${topic.status}`) }}</span>
                <span v-if="topic.pinned_scope" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">{{ t(`admin_pages.discussions.topics.pinned.${topic.pinned_scope}`) }}</span>
                <span v-if="topic.featured" class="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">{{ t('admin_pages.discussions.topics.flags.featured') }}</span>
                <span v-if="topic.locked" class="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">{{ t('admin_pages.discussions.topics.flags.locked') }}</span>
                <span v-if="topic.article_id" class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">{{ t('admin_pages.discussions.topics.flags.article') }}</span>
                <span v-if="topic.category">· {{ topic.category.name }}</span>
              </p>
              <NuxtLink :to="`/discussions/${topic.id}`" target="_blank" class="mt-1 block font-semibold text-slate-900 underline decoration-slate-200 underline-offset-4">{{ topic.title }}</NuxtLink>
              <p class="mt-1 text-xs text-slate-400">
                <NuxtLink v-if="topic.user" :to="{ query: { user: topic.user.username } }" class="hover:text-slate-700">{{ topic.user.nickname || topic.user.username }}</NuxtLink>
                · {{ time(topic.created_at) }}
                · {{ t('admin_pages.discussions.topics.stats', { replies: topic.replies_count, views: topic.views_count }) }}
                <template v-if="topic.last_posted_at"> · {{ t('admin_pages.discussions.topics.last_posted', { time: time(topic.last_posted_at) }) }}</template>
                <template v-if="topic.status === 'hidden' && topic.status_reason"> · {{ t('admin_pages.discussions.posts.reason', { reason: topic.status_reason }) }}</template>
                · <NuxtLink :to="`/admin/discussions/posts?topic_id=${topic.id}`" class="underline hover:text-slate-700">{{ t('admin_pages.discussions.topics.view_posts') }}</NuxtLink>
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-1.5 text-xs">
              <button type="button" :class="button" @click="start(topic, 'pin')">{{ t('admin_pages.discussions.topics.actions.pin') }}</button>
              <button type="button" :class="button" @click="start(topic, topic.featured ? 'unfeature' : 'feature')">{{ t(`admin_pages.discussions.topics.actions.${topic.featured ? 'unfeature' : 'feature'}`) }}</button>
              <button type="button" :class="button" @click="start(topic, topic.locked ? 'unlock' : 'lock')">{{ t(`admin_pages.discussions.topics.actions.${topic.locked ? 'unlock' : 'lock'}`) }}</button>
              <button v-if="!topic.article_id" type="button" :class="button" @click="start(topic, 'move')">{{ t('admin_pages.discussions.topics.actions.move') }}</button>
              <template v-if="topic.first_post_id && !topic.article_id">
                <button v-if="topic.status === 'visible'" type="button" :class="[button, 'border-amber-300 text-amber-700']" @click="start(topic, 'hide')">{{ t('admin_pages.discussions.actions.hide') }}</button>
                <button v-else type="button" :class="button" @click="start(topic, 'unhide')">{{ t('admin_pages.discussions.actions.unhide') }}</button>
              </template>
              <button v-if="!topic.article_id" type="button" :class="[button, 'border-red-300 text-red-700']" @click="start(topic, 'delete')">{{ t('admin_pages.discussions.actions.delete') }}</button>
            </div>
          </div>
        </li>
      </ul>
      <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>
    <AdminConfirmDialog
      v-model="actOpen" :busy="busy" :reason-required="acting ? ['hide', 'delete'].includes(acting.action) : false"
      :title="acting ? t(`admin_pages.discussions.topics.confirm.${acting.action}`, { title: acting.topic.title }) : ''"
      :description="acting ? t(`admin_pages.discussions.topics.confirm_help.${acting.action}`) : ''"
      :confirm-disabled="acting?.action === 'move' && (!moveTo || moveTo === acting.topic.category_id)" @confirm="act"
    >
      <label v-if="acting?.action === 'pin'" class="mt-4 block text-sm">
        {{ t('admin_pages.discussions.topics.pin_scope') }}
        <select v-model="pinScope" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option v-for="value in ['none', 'category', 'global']" :key="value" :value="value">{{ t(`admin_pages.discussions.topics.pin_scopes.${value}`) }}</option>
        </select>
      </label>
      <label v-if="acting?.action === 'move'" class="mt-4 block text-sm">
        {{ t('admin_pages.discussions.topics.move_to') }}
        <select v-model="moveTo" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.parent_id ? '└ ' : '' }}{{ category.name }}</option>
        </select>
      </label>
    </AdminConfirmDialog>
  </div>
</template>
