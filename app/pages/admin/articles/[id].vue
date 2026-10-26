<script setup lang="ts">
import type { AdminArticle } from '~/types/admin'
import type { ArticleType } from '~/types/article'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const articleDoneLabels: Record<Action, string> = { hide: '已隐藏', unhide: '已重新公开', lock: '已锁定', unlock: '已解锁' }
const articleHelpLabels: Record<Action, string> = {
  hide: '文章不再公开，并取消编辑推荐。原因会通知作者，作者之后可以自己重新公开。',
  unhide: '把版主隐藏的文章恢复为已发布。原因会通知作者。作者自己隐藏的文章不能由版主公开。',
  lock: '文章不再公开，作者不能编辑、公开或隐藏，只能删除。原因会通知作者。',
  unlock: '文章恢复到锁定前的状态（已发布或已隐藏），作者会收到通知。',
}
const articleLinkTypeLabels: Record<string, string> = { album: '专辑', artist: '艺术家', entry: '条目', franchise: '系列', event: '活动' }
const articleTitleLabels: Record<Action, string> = { hide: '隐藏文章', unhide: '重新公开文章', lock: '锁定文章', unlock: '解除锁定' }
const articleViewLabels: Record<string, string> = { rendered: '渲染', source: '原文' }
const licenseNameLabels: Record<string, string> = {
  all_rights_reserved: '保留所有权利',
  cc_by_nc_sa: '署名-非商业性使用-相同方式共享',
  cc_by_nc: '署名-非商业性使用',
  cc_by_nc_nd: '署名-非商业性使用-禁止演绎',
  cc_by_sa: '署名-相同方式共享',
  cc_by: '署名',
  cc_by_nd: '署名-禁止演绎',
  cc0: '公共领域',
}
const { types, typeName } = useArticleTypes()
const id = computed(() => Number(route.params.id))
const { data, pending, error, refresh } = await useAsyncData(`admin-article-${route.params.id}`, () => $api<AdminArticle>(`/v1/admin/articles/${id.value}`))

const busy = ref(false)
const notice = ref('')
const message = ref('')
async function run(action: () => Promise<unknown>, done: string, after?: () => void | Promise<void>) {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = done
    await (after ? after() : refresh())
  }
  catch (failure) { message.value = adminError(failure, '操作失败，请重试。') }
  finally { busy.value = false }
}

const contentView = ref<'rendered' | 'source'>('rendered')

// ── Moderation: hide and lock take the article off the site, with a reason the author sees; unhide puts back what a moderator hid ──
type Action = 'hide' | 'unhide' | 'lock' | 'unlock'
const pendingAction = ref<Action | null>(null)
const actionOpen = computed({ get: () => pendingAction.value !== null, set: (open) => { if (!open) pendingAction.value = null } })
const moderate = (reason: string) => {
  const action = pendingAction.value
  if (!action) return
  return run(() => $api(`/v1/admin/articles/${id.value}/${action}`, { method: 'POST', body: { reason } }), articleDoneLabels[action],
    async () => { pendingAction.value = null; await refresh() })
}
const deleteOpen = ref(false)
const toggleFeatured = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { featured: !data.value?.featured } }), '已保存')
const remove = (reason: string) => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'DELETE', body: { reason } }), '已删除',
  async () => { deleteOpen.value = false; await router.push('/admin/articles') })

const slug = ref('')
watch(data, (value) => { slug.value = value?.slug ?? '' }, { immediate: true })
const saveSlug = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { slug: slug.value.trim() || null } }), '已保存')

const editing = ref(false)
const edit = reactive({ type: null as ArticleType | null, title: '', summary: '', cover_url: '', banner_url: '', content: '', reason: '' })
function startEdit() {
  const article = data.value
  if (!article) return
  Object.assign(edit, { type: article.type, title: article.title ?? '', summary: article.summary ?? '', cover_url: article.cover_url ?? '', banner_url: article.banner_url ?? '', content: article.content ?? '', reason: '' })
  editing.value = true
}
const saveEdit = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: {
  type: edit.type, title: edit.title, summary: edit.summary || null, cover_url: edit.cover_url.trim() || null, banner_url: edit.banner_url.trim() || null, content: edit.content, reason: edit.reason.trim(),
} }), '已保存，修改立即生效', async () => { editing.value = false; await refresh() })

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => data.value?.title ?? '文章管理') })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/articles" class="text-sm text-slate-500 hover:text-slate-900">← 返回列表</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">
              {{ articleStatusLabels[data.status] }}
              <template v-if="data.status === 'locked' && data.locked_previous_status">（解锁后恢复为{{ articleStatusLabels[data.locked_previous_status] }}）</template>
              <template v-if="data.type"> · {{ typeName(data.type, 'zh-Hans') }}</template>
              <template v-if="data.featured"> · 编辑推荐</template>
            </p>
            <h1 class="mt-1 text-2xl font-bold">{{ data.title || '无标题' }}</h1>
            <p class="mt-1 text-sm text-slate-500">
              作者：<NuxtLink v-if="data.author" :to="`/admin/users/${data.author.id}`" class="underline">{{ data.author.nickname || data.author.username }}</NuxtLink>
              · 发布时间 {{ time(data.published_at) }}
              <template v-if="data.edited_at"> · 最后修改 {{ time(data.edited_at) }}</template>
              · 浏览 {{ data.views_count.toLocaleString() }}
              · 喜欢 {{ data.likes_count.toLocaleString() }}
            </p>
            <p v-if="data.status_reason" class="mt-1 text-sm text-rose-700">原因：{{ data.status_reason }}</p>
          </div>
          <div class="flex flex-wrap gap-2 text-sm">
            <NuxtLink v-if="data.status === 'published'" :to="`/articles/${data.id}`" target="_blank" class="rounded-lg border px-3 py-2">前台预览</NuxtLink>
            <template v-if="data.status === 'published'">
              <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="toggleFeatured">{{ data.featured ? '取消推荐' : '设为推荐' }}</button>
              <button type="button" :disabled="busy" class="rounded-lg border border-amber-300 px-3 py-2 text-amber-800 disabled:opacity-50" @click="pendingAction = 'hide'">隐藏</button>
            </template>
            <button v-if="data.status === 'hidden' && data.status_changed_at" type="button" :disabled="busy" class="rounded-lg border border-emerald-300 px-3 py-2 text-emerald-700 disabled:opacity-50" @click="pendingAction = 'unhide'">重新公开</button>
            <button v-if="data.status === 'locked'" type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="pendingAction = 'unlock'">解锁</button>
            <button v-else type="button" :disabled="busy" class="rounded-lg border border-rose-300 px-3 py-2 text-rose-700 disabled:opacity-50" @click="pendingAction = 'lock'">锁定</button>
            <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="startEdit">编辑</button>
            <button type="button" :disabled="busy" class="rounded-lg border border-red-300 px-3 py-2 text-red-700 disabled:opacity-50" @click="deleteOpen = true">删除</button>
          </div>
        </header>
        <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <section v-if="data.reports.length" class="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm">
          <h2 class="font-semibold text-rose-800">{{ data.reports.length }} 条待处理举报</h2>
          <ul class="mt-2 space-y-1 text-rose-900">
            <li v-for="report in data.reports" :key="report.id">{{ reportReasonLabels[report.reason] }}<template v-if="report.note">：{{ report.note }}</template>
              <span class="text-xs text-rose-600/70"> — {{ report.reporter?.nickname || report.reporter?.username || '关键词过滤' }}</span></li>
          </ul>
          <NuxtLink :to="`/admin/reports?article_id=${data.id}`" class="mt-2 inline-block text-xs underline">去处理举报</NuxtLink>
        </section>

        <!-- Moderator edit, applied at once -->
        <form v-if="editing" class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2" @submit.prevent="saveEdit">
          <p class="text-xs text-slate-500 sm:col-span-2">修改立即生效，作者会收到通知；作者还没保存的本地修改需要和这次修改合并。</p>
          <label class="block sm:col-span-2">标题<input v-model="edit.title" :required="data.status !== 'draft'" maxlength="100" :class="input"></label>
          <label class="block">类型<select v-model="edit.type" :required="data.status !== 'draft'" :class="input"><option v-for="option in types.filter(item => item.is_active || item.key === edit.type)" :key="option.key" :value="option.key">{{ typeName(option.key, 'zh-Hans') }}</option></select></label>
          <label class="block">封面 URL<input v-model="edit.cover_url" type="url" maxlength="500" :class="input"></label>
          <label class="block">页面横幅 URL<input v-model="edit.banner_url" type="url" maxlength="500" :class="input"></label>
          <label class="block sm:col-span-2">摘要<input v-model="edit.summary" maxlength="200" :class="input"></label>
          <div class="sm:col-span-2"><MarkdownEditor v-model="edit.content" :guide-url="null" /></div>
          <label class="block sm:col-span-2">原因（必填）<input v-model="edit.reason" required maxlength="2000" :class="input"></label>
          <div class="flex justify-end gap-2 sm:col-span-2">
            <button type="button" class="rounded-lg border px-4 py-2" @click="editing = false">取消</button>
            <button type="submit" :disabled="busy || !edit.reason.trim()" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">保存</button>
          </div>
        </form>

        <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex justify-end gap-1">
              <button
                v-for="view in ['rendered', 'source'] as const" :key="view" type="button"
                class="rounded-md px-2.5 py-1 text-xs" :class="contentView === view ? 'bg-slate-100 font-semibold' : 'text-slate-500'" @click="contentView = view">
                {{ articleViewLabels[view] }}
              </button>
            </div>
            <dl class="grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-[6rem_1fr]">
              <dt>摘要</dt><dd class="text-slate-700">{{ data.summary || '—' }}</dd>
              <dt>标签</dt><dd class="text-slate-700">{{ data.tags.map(tag => tag.name).join('、') || '—' }}</dd>
              <dt>关联内容</dt><dd class="text-slate-700">{{ data.links.map(link => `${articleLinkTypeLabels[link.type]}：${link.title}`).join('；') || '—' }}</dd>
              <dt>封面 URL</dt><dd class="truncate text-slate-700">{{ data.cover_url || '—' }}</dd>
              <dt>页面横幅 URL</dt><dd class="truncate text-slate-700">{{ data.banner_url || '—' }}</dd>
              <dt>创作声明</dt>
              <dd v-if="data.is_repost" class="min-w-0 text-slate-700">
                转载<template v-if="data.source_author"> · {{ data.source_author }}</template> ·
                <a v-if="data.source_url" :href="data.source_url" target="_blank" rel="noopener nofollow" class="break-all underline">{{ data.source_url }}</a><span v-else>—</span>
              </dd>
              <dd v-else class="text-slate-700">原创 · {{ licenseNameLabels[data.license] }}</dd>
            </dl>
            <p v-if="!data.content" class="text-sm text-slate-500">没有可显示的内容。</p>
            <RichContent v-else-if="contentView === 'rendered'" :content="data.content" format="markdown" />
            <pre v-else class="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{{ data.content }}</pre>
          </section>

          <aside class="space-y-4">
            <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 class="font-semibold">自定义链接</h2>
              <form class="mt-2 flex gap-2" @submit.prevent="saveSlug">
                <input v-model="slug" maxlength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs">
                <button type="submit" :disabled="busy || slug === (data.slug ?? '')" class="rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-40">保存</button>
              </form>
            </section>
          </aside>
        </div>
      </template>
    </AdminListState>

    <AdminConfirmDialog
      v-model="actionOpen" :busy="busy" reason-required :title="pendingAction ? articleTitleLabels[pendingAction] : ''"
      :description="pendingAction ? articleHelpLabels[pendingAction] : ''" @confirm="moderate" />
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required title="删除文章" description="永久删除文章及其关联、标签和举报，并刷新相关专辑的文章数。删除前的内容写入操作日志。" @confirm="remove" />
  </div>
</template>
