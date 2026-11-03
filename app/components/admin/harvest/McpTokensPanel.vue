<script setup lang="ts">
import type { HarvestToken } from '~/types/harvest'

const { $api } = useNuxtApp()
const harvestError = useHarvestError()

const { data, pending, error, refresh } = await useAsyncData('admin-harvest-mcp-tokens', () => $api<{ tokens: HarvestToken[] }>('/v1/admin/harvest/mcp-tokens'))
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
    fresh.value = await $api<HarvestToken>('/v1/admin/harvest/mcp-tokens', { method: 'POST', body: { name: name.value.trim() } })
    copied.value = false
    name.value = ''
    await refresh()
  } catch (e) {
    failure.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
/** The MCP server's address: the API's origin, /mcp/harvest. */
const endpoint = computed(() => `${(useRuntimeConfig().public.apiBaseUrl || 'https://api.cdcat.net').replace(/\/v\d+\/?$/, '').replace(/\/$/, '')}/mcp/harvest`)
/** Registers the server in Claude Code with the new token. */
const command = computed(() => `claude mcp add --transport http cdcat-harvest ${endpoint.value} --header "Authorization: Bearer ${fresh.value?.token ?? '〈令牌〉'}"`)
const copy = async () => {
  if (!fresh.value?.token) return
  await navigator.clipboard.writeText(command.value)
  copied.value = true
}
const revoking = ref<HarvestToken | null>(null)
const revokeOpen = computed({ get: () => !!revoking.value, set: (value) => { if (!value) revoking.value = null } })
const revoke = async () => {
  if (!revoking.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/harvest/mcp-tokens/${revoking.value.id}`, { method: 'DELETE' })
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
    <h2 class="font-semibold">MCP 令牌（模型核对草稿）</h2>
    <p class="text-sm text-slate-600">Claude Code 这类模型客户端用令牌连到本站的 MCP 服务器，读候选、按官网核对并修改候选的共用草稿（每处修改附依据，审核页会提示载入）。令牌只能用在 MCP 服务器上，不能审核通过，也不能访问其他接口。</p>
    <form class="flex flex-wrap gap-2" @submit.prevent="create">
      <input v-model="name" maxlength="60" placeholder="用途（例如：Claude Code）" aria-label="用途（例如：Claude Code）" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
      <UiButton type="submit" variant="primary" size="sm" :disabled="busy || !name.trim()">新建令牌</UiButton>
    </form>
    <div v-if="fresh?.token" role="status" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p class="text-amber-900">令牌只显示这一次。在终端里运行这条命令，把服务器加进 Claude Code：</p>
      <div class="flex gap-2">
        <code class="min-w-0 flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs">{{ command }}</code>
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
    <AdminConfirmDialog v-model="revokeOpen" :title="`吊销令牌「${revoking?.name ?? ''}」？`" description="用这个令牌的模型客户端之后就连不上了。" :busy="busy" @confirm="revoke" />
  </section>
</template>
