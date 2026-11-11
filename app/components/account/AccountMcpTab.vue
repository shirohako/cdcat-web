<script setup lang="ts">
import { KeyRound } from '@lucide/vue'

/** One of the member's drafts MCP tokens; the secret comes once, right after creating it. */
interface McpToken {
  id: number
  name: string
  created_at: string | null
  last_used_at: string | null
  token?: string
}

/**
 * Tokens for the drafts MCP server (docs/catalog/editing.md#草稿-mcp): an AI client such as Claude Code writes the
 * member's drafts saved to CDCat with one. Only for drafts.mcp (staff to begin with); a token opens /mcp/drafts alone.
 */
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { confirm } = useConfirm()
const { ago } = useRelativeTime()

const tokens = ref<McpToken[]>([])
const loading = ref(true)
const name = ref('')
const busy = ref(false)
const message = ref('')
const fresh = ref<McpToken | null>(null)
const copied = ref(false)

async function load() {
  try {
    tokens.value = (await $api<{ tokens: McpToken[] }>('/v1/me/mcp-tokens')).tokens
  }
  catch (failure) {
    message.value = localizeError(failure)
  }
  finally {
    loading.value = false
  }
}
// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) load()
else onMounted(load)

/** The MCP server's address: the API's origin, /mcp/drafts. */
const endpoint = computed(() => `${(useRuntimeConfig().public.apiBaseUrl || 'https://api.cdcat.net').replace(/\/v\d+\/?$/, '').replace(/\/$/, '')}/mcp/drafts`)
/** Registers the server in Claude Code with the new token. */
const command = computed(() => `claude mcp add --transport http cdcat-drafts ${endpoint.value} --header "Authorization: Bearer ${fresh.value?.token ?? '<token>'}"`)

async function create() {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  message.value = ''
  try {
    fresh.value = await $api<McpToken>('/v1/me/mcp-tokens', { method: 'POST', body: { name: name.value.trim() } })
    copied.value = false
    name.value = ''
    await load()
  }
  catch (failure) {
    message.value = localizeError(failure)
  }
  finally {
    busy.value = false
  }
}

async function copy() {
  await navigator.clipboard.writeText(command.value)
  copied.value = true
}

async function revoke(token: McpToken) {
  if (!await confirm({ title: t('account_pages.mcp.revoke_confirm', { name: token.name }), description: t('account_pages.mcp.revoke_hint'), confirmText: t('account_pages.mcp.revoke') })) return
  busy.value = true
  try {
    await $api(`/v1/me/mcp-tokens/${token.id}`, { method: 'DELETE' })
    if (fresh.value?.id === token.id) fresh.value = null
    await load()
  }
  catch (failure) {
    message.value = localizeError(failure)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="card overflow-hidden">
      <div class="border-b border-line p-6 pb-5">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.mcp.title') }}</h2>
        <p class="mt-1 text-sm text-meta">{{ t('account_pages.mcp.intro') }}</p>
      </div>
      <div class="space-y-4 p-6">
        <form class="flex gap-2" @submit.prevent="create">
          <input v-model="name" maxlength="60" class="input min-w-0 flex-1" :placeholder="t('account_pages.mcp.name_placeholder')" :aria-label="t('account_pages.mcp.name_placeholder')">
          <UiButton type="submit" variant="primary" size="sm" :disabled="busy || !name.trim()">{{ t('account_pages.mcp.create') }}</UiButton>
        </form>
        <div v-if="fresh?.token" role="status" class="space-y-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-body">
          <p>{{ t('account_pages.mcp.created_hint') }}</p>
          <div class="flex gap-2">
            <code class="min-w-0 flex-1 break-all rounded-lg bg-sunken px-2.5 py-1.5 font-mono text-xs text-title">{{ command }}</code>
            <UiButton size="sm" class="shrink-0" @click="copy">{{ copied ? t('account_pages.mcp.copied') : t('account_pages.mcp.copy') }}</UiButton>
          </div>
        </div>
        <p v-if="message" class="text-sm text-danger" role="alert">{{ message }}</p>
        <SkeletonRows v-if="loading" :count="2" />
        <ul v-else-if="tokens.length" class="divide-y divide-line rounded-xl bg-sunken">
          <li v-for="token in tokens" :key="token.id" class="flex items-center gap-3 px-4 py-2.5">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-title">{{ token.name }}</p>
              <p class="text-xs text-meta">{{ token.last_used_at ? t('account_pages.mcp.last_used', { at: ago(token.last_used_at) }) : t('account_pages.mcp.never_used') }}</p>
            </div>
            <UiButton variant="danger-soft" size="xs" :disabled="busy" @click="revoke(token)">{{ t('account_pages.mcp.revoke') }}</UiButton>
          </li>
        </ul>
        <UiEmpty v-else :title="t('account_pages.mcp.empty')" :icon="KeyRound" />
      </div>
    </section>
  </div>
</template>
