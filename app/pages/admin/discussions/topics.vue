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
const topicConfirmLabels: Record<string, string> = { 'pin': '设置置顶', 'feature': '设为精华', 'unfeature': '取消精华', 'lock': '锁定主题', 'unlock': '解锁主题', 'move': '移动主题', 'hide': '折叠主题', 'unhide': '取消折叠', 'delete': '删除主题' }
const discussionTopicActionLabels: Record<string, string> = { pin: '置顶', feature: '加精', unfeature: '取消精华', lock: '锁定', unlock: '解锁', move: '移动' }
const discussionTopicConfirmHelpLabels: Record<string, string> = {
  pin: '版块置顶只在所在版块顶部显示，全站置顶在讨论首页也显示。',
  feature: '主题会出现在精华列表。',
  unfeature: '主题不再出现在精华列表。',
  lock: '锁定后只有版主能回复。',
  unlock: '所有人恢复可以回复。',
  move: '主题和全部回复一起移到新版块。',
  hide: '折叠 1 楼，主题从列表和搜索里消失，链接仍能打开。作者会收到通知和原因。',
  unhide: '1 楼恢复显示，主题回到列表。',
  delete: '主题和全部回复永久删除，原文写入操作日志，作者会收到通知。',
}
const discussionTopicFlagLabels: Record<string, string> = { pinned: '置顶中', featured: '精华', locked: '已锁定', article: '文章评论' }
const discussionTopicPinScopeLabels: Record<string, string> = { none: '不置顶', category: '版块置顶', global: '全站置顶' }
const discussionTopicPinnedLabels: Record<string, string> = { category: '版块置顶', global: '全站置顶' }
const discussionTopicSortLabels: Record<string, string> = { created: '按发布时间', last_posted: '按最后回复', posts: '按回复数', views: '按浏览量' }

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
    notice.value = '已保存'
    acting.value = null
    await refresh()
  }
  catch (failure) { message.value = adminError(failure, '操作失败，请重试。') }
  finally { busy.value = false }
}

const tone: Record<string, string> = { visible: 'bg-emerald-50 text-emerald-700', hidden: 'bg-amber-50 text-amber-700' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm'
useHead({ title: '主题' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">主题</h1>
      <p class="mt-2 text-sm text-slate-600">按主题管理：置顶、加精、锁定、移动版块、折叠（折叠 1 楼）和删除。单条帖子和回复在「全部帖子」里处理；文章评论主题跟随文章，不能移动、折叠或删除。</p>
    </header>
    <form class="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3" @submit.prevent="apply">
      <input v-model="filters.search" type="search" maxlength="100" :class="[field, 'min-w-48 flex-1']" placeholder="搜索标题">
      <input v-model="filters.user" maxlength="32" :class="[field, 'w-36']" placeholder="用户名">
      <select v-model="filters.category" :class="field">
        <option value="">全部版块</option>
        <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.parent_id ? '└ ' : '' }}{{ category.name }}</option>
      </select>
      <select v-model="filters.status" :class="field">
        <option value="">全部状态</option>
        <option v-for="value in ['visible', 'hidden']" :key="value" :value="value">{{ postStatusLabels[value] }}</option>
      </select>
      <select v-model="filters.flag" :class="field">
        <option value="">全部主题</option>
        <option v-for="value in ['pinned', 'featured', 'locked', 'article']" :key="value" :value="value">{{ discussionTopicFlagLabels[value] }}</option>
      </select>
      <select v-model="filters.sort" :class="field">
        <option v-for="value in ['created', 'last_posted', 'posts', 'views']" :key="value" :value="value === 'created' ? '' : value">{{ discussionTopicSortLabels[value] }}</option>
      </select>
      <UiButton type="submit" variant="primary" size="sm">应用</UiButton>
    </form>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <p class="mb-2 text-sm text-slate-500">共 {{ data?.pagination.total ?? 0 }} 条</p>
      <ul class="space-y-2">
        <li v-for="topic in data?.items" :key="topic.id" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span class="rounded px-1.5 py-0.5 font-medium" :class="tone[topic.status]">{{ postStatusLabels[topic.status] }}</span>
                <span v-if="topic.pinned_scope" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">{{ discussionTopicPinnedLabels[topic.pinned_scope] }}</span>
                <span v-if="topic.featured" class="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">精华</span>
                <span v-if="topic.locked" class="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">已锁定</span>
                <span v-if="topic.article_id" class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">文章评论</span>
                <span v-if="topic.category">· {{ topic.category.name }}</span>
              </p>
              <NuxtLink :to="`/discussions/${topic.id}`" target="_blank" class="mt-1 block font-semibold text-slate-900 underline decoration-slate-200 underline-offset-4">{{ topic.title }}</NuxtLink>
              <p class="mt-1 text-xs text-slate-400">
                <NuxtLink v-if="topic.user" :to="{ query: { user: topic.user.username } }" class="hover:text-slate-700">{{ topic.user.nickname || topic.user.username }}</NuxtLink>
                · {{ time(topic.created_at) }}
                · {{ topic.replies_count }} 回复 · {{ topic.views_count }} 浏览
                <template v-if="topic.last_posted_at"> · 最后回复 {{ time(topic.last_posted_at) }}</template>
                <template v-if="topic.status === 'hidden' && topic.status_reason"> · 原因：{{ topic.status_reason }}</template>
                · <NuxtLink :to="`/admin/discussions/posts?topic_id=${topic.id}`" class="underline hover:text-slate-700">查看帖子</NuxtLink>
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-1.5">
              <UiButton size="xs" @click="start(topic, 'pin')">置顶</UiButton>
              <UiButton size="xs" @click="start(topic, topic.featured ? 'unfeature' : 'feature')">{{ discussionTopicActionLabels[topic.featured ? 'unfeature' : 'feature'] }}</UiButton>
              <UiButton size="xs" @click="start(topic, topic.locked ? 'unlock' : 'lock')">{{ discussionTopicActionLabels[topic.locked ? 'unlock' : 'lock'] }}</UiButton>
              <UiButton v-if="!topic.article_id" size="xs" @click="start(topic, 'move')">移动</UiButton>
              <template v-if="topic.first_post_id && !topic.article_id">
                <UiButton v-if="topic.status === 'visible'" size="xs" @click="start(topic, 'hide')">折叠</UiButton>
                <UiButton v-else size="xs" @click="start(topic, 'unhide')">取消折叠</UiButton>
              </template>
              <UiButton v-if="!topic.article_id" variant="danger-soft" size="xs" @click="start(topic, 'delete')">删除</UiButton>
            </div>
          </div>
        </li>
      </ul>
      <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>
    <AdminConfirmDialog
      v-model="actOpen" :busy="busy" :reason-required="acting ? ['hide', 'delete'].includes(acting.action) : false"
      :title="acting ? `${topicConfirmLabels[acting.action]}：${acting.topic.title}` : ''"
      :description="acting ? discussionTopicConfirmHelpLabels[acting.action] : ''"
      :confirm-disabled="acting?.action === 'move' && (!moveTo || moveTo === acting.topic.category_id)" @confirm="act"
    >
      <label v-if="acting?.action === 'pin'" class="mt-4 block text-sm">
        置顶范围
        <select v-model="pinScope" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option v-for="value in ['none', 'category', 'global']" :key="value" :value="value">{{ discussionTopicPinScopeLabels[value] }}</option>
        </select>
      </label>
      <label v-if="acting?.action === 'move'" class="mt-4 block text-sm">
        移动到
        <select v-model="moveTo" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.parent_id ? '└ ' : '' }}{{ category.name }}</option>
        </select>
      </label>
    </AdminConfirmDialog>
  </div>
</template>
