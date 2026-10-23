<script setup lang="ts">
import type { HarvestToken } from '~/types/harvest'

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const harvestError = useHarvestError()

const { data, pending, error, refresh } = await useAsyncData('admin-harvest-tokens', () => $api<{ tokens: HarvestToken[] }>('/v1/admin/harvest/tokens'))
const name = ref('')
const busy = ref(false)
const failure = ref('')
/** The new token's secret: shown once, right after creating it. */
const fresh = ref<HarvestToken | null>(null)
const copied = ref(false)
const create = async () => {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  failure.value = ''
  try {
    fresh.value = await $api<HarvestToken>('/v1/admin/harvest/tokens', { method: 'POST', body: { name: name.value.trim() } })
    copied.value = false
    name.value = ''
    await refresh()
  } catch (e) {
    failure.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
const copy = async () => {
  if (!fresh.value?.token) return
  await navigator.clipboard.writeText(fresh.value.token)
  copied.value = true
}
const revoking = ref<HarvestToken | null>(null)
const revokeOpen = computed({ get: () => !!revoking.value, set: (value) => { if (!value) revoking.value = null } })
const revoke = async () => {
  if (!revoking.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/harvest/tokens/${revoking.value.id}`, { method: 'DELETE' })
    if (fresh.value?.id === revoking.value.id) fresh.value = null
    revoking.value = null
    await refresh()
  } catch (e) {
    failure.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : ''
</script>

<template>
  <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    <h2 class="font-semibold">{{ t('admin_pages.harvest.tokens.title') }}</h2>
    <p class="text-sm text-slate-600">{{ t('admin_pages.harvest.tokens.help') }}</p>
    <form class="flex flex-wrap gap-2" @submit.prevent="create">
      <input v-model="name" maxlength="60" :placeholder="t('admin_pages.harvest.tokens.name')" :aria-label="t('admin_pages.harvest.tokens.name')" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
      <button type="submit" class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50" :disabled="busy || !name.trim()">{{ t('admin_pages.harvest.tokens.create') }}</button>
    </form>
    <div v-if="fresh?.token" role="status" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p class="text-amber-900">{{ t('admin_pages.harvest.tokens.created') }}</p>
      <div class="flex gap-2">
        <code class="min-w-0 flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs">{{ fresh.token }}</code>
        <button type="button" class="shrink-0 rounded border border-amber-300 bg-white px-2 py-1" @click="copy">{{ copied ? t('admin_pages.harvest.tokens.copied') : t('admin_pages.harvest.tokens.copy') }}</button>
      </div>
    </div>
    <p v-if="failure" role="alert" class="text-sm text-red-700">{{ failure }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.tokens.length" @retry="refresh()">
      <ul class="divide-y divide-slate-100 text-sm">
        <li v-for="token in data?.tokens" :key="token.id" class="flex items-center gap-3 py-2">
          <span class="flex-1 font-medium">{{ token.name }}</span>
          <span class="text-xs text-slate-500">{{ token.last_used_at ? t('admin_pages.harvest.tokens.last_used', { time: time(token.last_used_at) }) : t('admin_pages.harvest.tokens.never_used') }}</span>
          <button type="button" class="text-xs text-red-700 underline" @click="revoking = token">{{ t('admin_pages.harvest.tokens.revoke') }}</button>
        </li>
      </ul>
    </AdminListState>
    <AdminConfirmDialog v-model="revokeOpen" :title="t('admin_pages.harvest.tokens.revoke_title', { name: revoking?.name ?? '' })" :description="t('admin_pages.harvest.tokens.revoke_help')" :busy="busy" @confirm="revoke" />
  </section>
</template>
