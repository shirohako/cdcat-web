<script setup lang="ts">
import type { AdminDiscussionRestriction, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const discussionRestrictionHelpLabels: Record<string, string> = {
  discussions: '禁言期间可以看帖、点表情、收藏和举报，不能发帖、回复和编辑。',
  lyrics: '限制期间不能新增或修改歌词。',
  shouts: '限制期间不能发布或修改留言，已有留言也不再显示。',
  reviews: '限制期间不能发布或修改专辑评价，已有评价照常显示。',
}
const discussionRestrictionScopeLabels: Record<string, string> = { discussions: '讨论区', lyrics: '歌词', shouts: '留言', reviews: '评价' }
const discussionRestrictionTabLabels: Record<string, string> = { active: '生效中', all: '全部' }
const { hasPermission } = useAuth()
/** Each scope is managed with its own permission: discussions, lyrics, shouts, reviews. */
const SCOPES = { discussions: 'discussions.moderate', lyrics: 'lyrics.manage', shouts: 'shouts.manage', reviews: 'reviews.manage' } as const
type Scope = keyof typeof SCOPES
const scopes = computed(() => (Object.keys(SCOPES) as Scope[]).filter(key => hasPermission(SCOPES[key])))
const scope = computed<Scope>(() => scopes.value.includes(route.query.scope as Scope) ? route.query.scope as Scope : scopes.value[0] ?? 'discussions')
const status = computed(() => route.query.status === 'all' ? 'all' : 'active')
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const { data, pending, error, refresh } = await useAsyncData('admin-discussion-restrictions',
  () => $api<{ items: AdminDiscussionRestriction[], pagination: AdminPagination }>('/v1/admin/restrictions', { query: { scope: scope.value, status: status.value, page: page.value } }), { watch: [scope, status, page] })

const form = reactive({ username: '', days: '3', reason: '' })
const busy = ref(false)
const notice = ref('')
const message = ref('')
async function run(action: () => Promise<unknown>, done: string) {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = done
    await refresh()
  }
  catch (failure) { message.value = adminError(failure, '操作失败，请重试。') }
  finally { busy.value = false }
}
const create = () => run(async () => {
  await $api('/v1/admin/restrictions', { method: 'POST', body: { scope: scope.value, username: form.username.trim().replace(/^@/, ''), days: form.days === 'forever' ? null : Number(form.days), reason: form.reason.trim() } })
  Object.assign(form, { username: '', days: '3', reason: '' })
}, '已禁言')
const revoking = ref<AdminDiscussionRestriction | null>(null)
const revokeOpen = computed({ get: () => revoking.value !== null, set: (open) => { if (!open) revoking.value = null } })
const revoke = (reason: string) => run(async () => {
  await $api(`/v1/admin/restrictions/${revoking.value!.id}`, { method: 'DELETE', body: { reason: reason || undefined } })
  revoking.value = null
}, '已解除禁言')
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: '用户限制' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">用户限制</h1>
      <p class="mt-2 text-sm text-slate-600">按范围限制用户：讨论区禁言、禁止改歌词、禁止发留言、禁止写评价。到期自动解除，也可以提前撤销。</p>
    </header>
    <nav v-if="scopes.length > 1" class="flex gap-2 text-sm">
      <NuxtLink
        v-for="value in scopes" :key="value" :to="{ query: { scope: value } }" class="rounded-lg border px-3 py-1.5"
        :class="scope === value ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white'">{{ discussionRestrictionScopeLabels[value] }}</NuxtLink>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <nav class="mb-3 flex gap-1 border-b border-slate-200 text-sm">
          <NuxtLink
            v-for="value in ['active', 'all']" :key="value" :to="{ query: { scope, ...(value === 'all' ? { status: 'all' } : {}) } }" class="-mb-px border-b-2 px-3 py-2"
            :class="status === value ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'">{{ discussionRestrictionTabLabels[value] }}</NuxtLink>
        </nav>
        <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
          <table class="w-full rounded-xl border border-slate-200 bg-white text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr><th class="px-4 py-2">用户</th><th class="px-4 py-2">截止</th><th class="px-4 py-2">原因（必填）</th><th class="px-4 py-2" /></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in data?.items" :key="item.id" :class="item.active ? '' : 'text-slate-400'">
                <td class="px-4 py-2">
                  <p class="font-medium">{{ item.user?.nickname || item.user?.username }}</p>
                  <p class="text-xs text-slate-400">@{{ item.user?.username }} · 由 {{ item.created_by?.nickname || item.created_by?.username }} 设置</p>
                </td>
                <td class="px-4 py-2 text-xs">
                  {{ item.ends_at ? time(item.ends_at) : '永久' }}
                  <p v-if="item.revoked_at" class="text-slate-400">{{ time(item.revoked_at) }} 由 {{ item.revoked_by?.nickname || item.revoked_by?.username }} 解除</p>
                </td>
                <td class="px-4 py-2 text-xs">{{ item.reason }}</td>
                <td class="px-4 py-2 text-right text-xs"><button v-if="item.active" type="button" class="underline" @click="revoking = item">解除</button></td>
              </tr>
            </tbody>
          </table>
          <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
        </AdminListState>
      </section>
      <form class="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm" @submit.prevent="create">
        <h2 class="font-semibold">新建禁言</h2>
        <label class="block">用户名<input v-model="form.username" required maxlength="33" :class="[field, 'font-mono']"></label>
        <label class="block">时长
          <select v-model="form.days" :class="field">
            <option v-for="value in ['1', '3', '7', '30']" :key="value" :value="value">{{ value }} 天</option>
            <option value="forever">永久</option>
          </select>
        </label>
        <label class="block">原因（必填）<textarea v-model="form.reason" required maxlength="2000" rows="3" :class="field" /></label>
        <p class="text-xs text-slate-500">{{ discussionRestrictionHelpLabels[scope] }}</p>
        <div class="flex justify-end"><button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">禁言</button></div>
      </form>
    </div>
    <AdminConfirmDialog v-model="revokeOpen" :busy="busy" :title="`解除对 ${revoking?.user?.nickname || revoking?.user?.username} 的禁言？`" @confirm="revoke" />
  </div>
</template>
