<script setup lang="ts">
import type { HarvestToken } from '~/types/harvest'

const { $api } = useNuxtApp()
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
    <h2 class="font-semibold">采集器令牌</h2>
    <p class="text-sm text-slate-600">采集器用令牌把数据和图片直接提交到本站。令牌只能用来提交采集数据，不能登录或访问其他接口；在采集器网页的「设置 → 本站」里填入。</p>
    <form class="flex flex-wrap gap-2" @submit.prevent="create">
      <input v-model="name" maxlength="60" placeholder="用途（例如：家里的电脑）" aria-label="用途（例如：家里的电脑）" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
      <UiButton type="submit" variant="primary" size="sm" :disabled="busy || !name.trim()">新建令牌</UiButton>
    </form>
    <div v-if="fresh?.token" role="status" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p class="text-amber-900">令牌只显示这一次，请马上复制到采集器里：</p>
      <div class="flex gap-2">
        <code class="min-w-0 flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs">{{ fresh.token }}</code>
        <UiButton size="sm" class="shrink-0" @click="copy">{{ copied ? '已复制' : '复制' }}</UiButton>
      </div>
    </div>
    <p v-if="failure" role="alert" class="text-sm text-red-700">{{ failure }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.tokens.length" @retry="refresh()">
      <ul class="divide-y divide-slate-100 text-sm">
        <li v-for="token in data?.tokens" :key="token.id" class="flex items-center gap-3 py-2">
          <span class="flex-1 font-medium">{{ token.name }}</span>
          <span class="text-xs text-slate-500">{{ token.last_used_at ? `最近使用 ${time(token.last_used_at)}` : '没用过' }}</span>
          <UiButton variant="danger-soft" size="xs" @click="revoking = token">吊销</UiButton>
        </li>
      </ul>
    </AdminListState>
    <AdminConfirmDialog v-model="revokeOpen" :title="`吊销令牌「${revoking?.name ?? ''}」？`" description="用这个令牌的采集器之后就不能提交了。" :busy="busy" @confirm="revoke" />
  </section>
</template>
