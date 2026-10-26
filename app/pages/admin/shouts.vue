<script setup lang="ts">
import type { AdminPagination, AdminShout } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const shoutActionLabels: Record<Action['kind'], string> = { hide: '隐藏留言', unhide: '取消隐藏', delete: '删除留言' }
const shoutDoneLabels: Record<Action['kind'], string> = { hide: '已隐藏', unhide: '已取消隐藏', delete: '已删除' }
const shoutHelpLabels: Record<Action['kind'], string> = { hide: '隐藏后只有作者自己能看到。', unhide: '留言会重新显示。', delete: '永久删除这条留言。' }

const filterKeys = ['search', 'is_hidden', 'artist_id', 'user_id'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData('admin-shouts',
  () => $api<{ items: AdminShout[], pagination: AdminPagination }>('/v1/admin/shouts', { query: query.value }), { watch: [query] })
const shouts = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })

type Action = { shout: AdminShout, kind: 'hide' | 'unhide' | 'delete' }
const action = ref<Action | null>(null)
const actionOpen = computed({ get: () => action.value !== null, set: (value) => { if (!value) action.value = null } })
const busy = ref(false)
const message = ref('')
const notice = ref('')

const run = async (reason: string) => {
  const current = action.value
  if (!current) return
  busy.value = true
  message.value = ''
  try {
    if (current.kind === 'delete') await $api(`/v1/admin/shouts/${current.shout.id}`, { method: 'DELETE', body: { reason } })
    else await $api(`/v1/admin/shouts/${current.shout.id}/hidden`, { method: 'PUT', body: { hidden: current.kind === 'hide', reason } })
    notice.value = shoutDoneLabels[current.kind]
    await refresh()
  } catch (failure) {
    message.value = adminError(failure, '操作失败，请重试。')
  } finally {
    action.value = null
    busy.value = false
  }
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: '留言' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">留言</h1>
      <p class="mt-2 text-sm text-slate-600">艺术家页上的留言。可以隐藏或删除违规留言，举报在「举报处理」里处理。</p>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" placeholder="搜索留言内容" aria-label="搜索留言内容" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.is_hidden" aria-label="显示状态" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部状态</option>
          <option value="0">显示中</option>
          <option value="1">已隐藏</option>
        </select>
        <input v-model="filters.artist_id" inputmode="numeric" pattern="[0-9]*" placeholder="艺术家 ID" aria-label="艺术家 ID" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" placeholder="用户 ID" aria-label="用户 ID" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
      </form>
    </AdminFilterBar>

    <p class="text-sm text-slate-500">共 {{ pagination.total }} 条</p>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!shouts.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="shout in shouts" :key="shout.id" class="flex flex-wrap items-start gap-3 px-5 py-3 text-sm" :class="{ 'bg-slate-50 text-slate-500': shout.is_hidden }">
            <div class="min-w-0 flex-1">
              <p class="whitespace-pre-line break-words">{{ shout.content }}</p>
              <p class="mt-1 text-xs text-slate-500">
                <NuxtLink v-if="shout.user" :to="`/admin/users/${shout.user.id}`" class="underline">{{ shout.user.nickname || shout.user.username }}</NuxtLink>
                ·
                <NuxtLink v-if="shout.artist" :to="`/artists/${shout.artist.id}`" target="_blank" class="underline">艺术家 {{ shout.artist.name }}</NuxtLink>
                · {{ time(shout.updated_at) }}
                <span v-if="shout.is_hidden" class="ml-1 rounded bg-amber-100 px-1.5 text-amber-800">已隐藏</span>
              </p>
            </div>
            <div class="flex gap-2 text-xs">
              <button v-if="!shout.is_hidden" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="action = { shout, kind: 'hide' }">隐藏留言</button>
              <button v-else type="button" class="rounded-lg border px-2.5 py-1.5" @click="action = { shout, kind: 'unhide' }">取消隐藏</button>
              <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="action = { shout, kind: 'delete' }">删除</button>
            </div>
          </li>
        </ul>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="actionOpen" :busy="busy" reason-required :title="action ? shoutActionLabels[action.kind] : ''" :description="action ? shoutHelpLabels[action.kind] : ''" @confirm="run" />
  </div>
</template>
