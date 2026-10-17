<script setup lang="ts">
import type { AdminPagination, AdminShout } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const filterKeys = ['search', 'is_hidden', 'album_id', 'artist_id', 'user_id'] as const
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
    notice.value = t(`admin_pages.shouts.done_${current.kind}`)
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure, 'admin_pages.action_failed')
  } finally {
    action.value = null
    busy.value = false
  }
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => t('admin_pages.shouts.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.shouts.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.shouts.description') }}</p>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.shouts.search')" :aria-label="t('admin_pages.shouts.search')" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.is_hidden" :aria-label="t('admin_pages.shouts.visibility')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.all_statuses') }}</option>
          <option value="0">{{ t('admin_pages.shouts.statuses.visible') }}</option>
          <option value="1">{{ t('admin_pages.shouts.statuses.hidden') }}</option>
        </select>
        <input v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.album_id')" :aria-label="t('admin_pages.content.album_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <input v-model="filters.artist_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.shouts.artist_id')" :aria-label="t('admin_pages.shouts.artist_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.user_id')" :aria-label="t('admin_pages.user_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>

    <p class="text-sm text-slate-500">{{ t('common.items_total', { count: pagination.total }) }}</p>
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
                <NuxtLink v-if="shout.album" :to="`/albums/${shout.album.id}`" target="_blank" class="underline">{{ t('admin_pages.types.album') }} {{ shout.album.title }}</NuxtLink>
                <NuxtLink v-else-if="shout.artist" :to="`/artists/${shout.artist.id}`" target="_blank" class="underline">{{ t('admin_pages.types.artist') }} {{ shout.artist.name }}</NuxtLink>
                · {{ time(shout.updated_at) }}
                <span v-if="shout.is_hidden" class="ml-1 rounded bg-amber-100 px-1.5 text-amber-800">{{ t('admin_pages.shouts.statuses.hidden') }}</span>
              </p>
            </div>
            <div class="flex gap-2 text-xs">
              <button v-if="!shout.is_hidden" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="action = { shout, kind: 'hide' }">{{ t('admin_pages.shouts.hide') }}</button>
              <button v-else type="button" class="rounded-lg border px-2.5 py-1.5" @click="action = { shout, kind: 'unhide' }">{{ t('admin_pages.shouts.unhide') }}</button>
              <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="action = { shout, kind: 'delete' }">{{ t('common.delete') }}</button>
            </div>
          </li>
        </ul>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="actionOpen" :busy="busy" reason-required :title="action ? t(`admin_pages.shouts.${action.kind}`) : ''" :description="action ? t(`admin_pages.shouts.${action.kind}_help`) : ''" @confirm="run" />
  </div>
</template>
