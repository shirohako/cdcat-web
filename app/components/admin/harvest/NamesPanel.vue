<script setup lang="ts">
import type { AdminCreditRole } from '~/types/admin'
import type { HarvestIdentity, HarvestPagination } from '~/types/harvest'

/** The name map; with the page's event_id, only names candidates linked to that event use. */
const { $api } = useNuxtApp()
const identityFilterLabels: Record<string, string> = { unresolved: '待处理', resolved: '已关联', ignored: '已忽略', all: '全部' }
const identityKindLabels: Record<string, string> = { circle_name: '社团名', shop_account: '店铺账号', credit_name: '人名', db_artist: '数据库 ID', role: '角色' }
const identityStatusLabels: Record<string, string> = { auto: '自动关联', linked: '已关联', created: '已新建', ignored: '已忽略', unresolved: '待处理' }
const nameKindFilterLabels: Record<string, string> = { person: '人名', circle: '社团', role: '角色' }
const harvestError = useHarvestError()
const route = useRoute()
const router = useRouter()

const eventId = computed({
  get: () => /^\d+$/.test(String(route.query.event_id ?? '')) ? String(route.query.event_id) : '',
  set: value => router.push({ query: { ...route.query, event_id: value || undefined } }),
})
const kind = ref<'person' | 'circle' | 'role'>('person')
const status = ref<'unresolved' | 'resolved' | 'ignored' | 'all'>('unresolved')
const q = ref('')
const page = ref(1)
watch([kind, status, q, eventId], () => { page.value = 1 })
const query = computed(() => ({ kind: kind.value, status: status.value, q: q.value || undefined, event_id: eventId.value || undefined, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-names-${JSON.stringify(query.value)}`,
  () => $api<{ identities: HarvestIdentity[], pagination: HarvestPagination }>('/v1/admin/harvest/identities', { query: query.value }),
  { watch: [query] },
)
const { data: roles } = await useAsyncData('admin-harvest-credit-roles', () => $api<AdminCreditRole[]>('/v1/admin/credit-roles'), { lazy: true })

const artistTypes = ['person', 'group', 'circle', 'virtual', 'company', 'character'] as const
const busy = ref(false)
const message = ref('')
const notice = ref('')
const open = ref<{ id: number, mode: 'link' | 'create' | 'role' } | null>(null)
const createForm = reactive({ name: '', type: 'person' })
const roleKey = ref('')

const start = (identity: HarvestIdentity, mode: 'link' | 'create' | 'role') => {
  open.value = { id: identity.id, mode }
  createForm.name = identity.label
  createForm.type = identity.type_hint && (artistTypes as readonly string[]).includes(identity.type_hint) ? identity.type_hint : identity.kind === 'credit_name' ? 'person' : 'circle'
  roleKey.value = identity.credit_role ?? ''
  message.value = ''
}
const resolve = async (identity: HarvestIdentity, body: Record<string, unknown>) => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    const result = await $api<{ rebuilt: number }>(`/v1/admin/harvest/identities/${identity.id}`, { method: 'PUT', body })
    notice.value = `已处理，更新了 ${result.rebuilt} 条候选`
    open.value = null
    await refresh()
  } catch (e) {
    message.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
const roleName = (key: string | null) => roles.value?.find(role => role.key === key)?.names['zh-Hans'] ?? key ?? ''
</script>

<template>
  <div class="space-y-4">
    <p class="max-w-3xl text-sm text-slate-600">来源里的人名、社团名和角色名。每个名字处理一次，之后所有候选都沿用；还没处理的人名会先以纯署名写入专辑。选了活动时只列关联到这届活动的候选用到的名字。</p>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="value in (['person', 'circle', 'role'] as const)" :key="value" type="button" class="rounded-full px-3 py-1" :class="kind === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="kind = value">
        {{ nameKindFilterLabels[value] }}
      </button>
      <select v-model="status" class="rounded-lg border border-slate-300 px-2 py-1.5">
        <option v-for="value in ['unresolved', 'resolved', 'ignored', 'all']" :key="value" :value="value">{{ identityFilterLabels[value] }}</option>
      </select>
      <input v-model.lazy="q" type="search" placeholder="名字" class="w-56 rounded-lg border border-slate-300 px-2 py-1.5">
      <AdminHarvestEventSelect v-model="eventId" />
      <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
    </div>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.identities.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="identity in data?.identities" :key="identity.id" class="px-4 py-3 text-sm">
            <div class="flex flex-wrap items-start gap-3">
              <div class="min-w-56 flex-1">
                <p class="font-medium">{{ identity.label }}
                  <span class="ml-1 text-xs font-normal text-slate-500">{{ identityKindLabels[identity.kind] }}<template v-if="identity.kind === 'shop_account'"> {{ identity.key }}</template></span>
                </p>
                <p class="text-xs text-slate-500">
                  {{ identityStatusLabels[identity.status] }}
                  <template v-if="identity.artist"> → {{ identity.artist.name }}</template>
                  <template v-if="identity.credit_role"> → {{ roleName(identity.credit_role) }}</template>
                  · {{ identity.occurrences }} 条候选
                </p>
                <p v-if="identity.candidates.length" class="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-600">
                  出现在
                  <NuxtLink v-for="candidate in identity.candidates" :key="candidate.id" :to="`/admin/harvest/candidates/${candidate.id}`" class="max-w-56 truncate text-sky-700 hover:underline">{{ candidate.title }}</NuxtLink>
                </p>
              </div>
              <div class="flex flex-wrap gap-3 text-xs">
                <template v-if="identity.kind === 'role'">
                  <button type="button" class="underline" @click="start(identity, 'role')">对应角色</button>
                </template>
                <template v-else>
                  <button type="button" class="underline" @click="start(identity, 'link')">关联到艺术家</button>
                  <button type="button" class="underline" @click="start(identity, 'create')">新建艺术家</button>
                </template>
                <button v-if="identity.status !== 'ignored'" type="button" class="underline" :disabled="busy" @click="resolve(identity, { action: 'ignore' })">忽略</button>
                <button v-if="identity.status !== 'unresolved'" type="button" class="underline" :disabled="busy" @click="resolve(identity, { action: 'reset' })">重新处理</button>
              </div>
            </div>
            <div v-if="open?.id === identity.id" class="mt-3 rounded-lg bg-slate-50 p-3">
              <EditorEntityPicker v-if="open.mode === 'link'" kind="artist" placeholder="搜索艺术家" class="max-w-md" @select="resolve(identity, { action: 'link', artist_id: $event.id })" />
              <form v-else-if="open.mode === 'create'" class="flex flex-wrap items-end gap-2 text-xs" @submit.prevent="resolve(identity, { action: 'create', name: createForm.name, artist_type: createForm.type })">
                <label>名字<input v-model="createForm.name" required maxlength="255" class="mt-1 block w-64 rounded border border-slate-300 px-2 py-1"></label>
                <label>类型
                  <select v-model="createForm.type" class="mt-1 block rounded border border-slate-300 px-2 py-1">
                    <option v-for="type in artistTypes" :key="type" :value="type">{{ artistTypeLabels[type] }}</option>
                  </select>
                </label>
                <button type="submit" class="rounded bg-slate-900 px-3 py-1.5 text-white" :disabled="busy">新建艺术家</button>
              </form>
              <form v-else class="flex flex-wrap items-end gap-2 text-xs" @submit.prevent="resolve(identity, { action: 'role', credit_role: roleKey })">
                <select v-model="roleKey" required class="rounded border border-slate-300 px-2 py-1">
                  <option value="">选择角色</option>
                  <option v-for="role in roles ?? []" :key="role.key" :value="role.key">{{ role.names['zh-Hans'] ?? role.key }}（{{ role.key }}）</option>
                </select>
                <button type="submit" class="rounded bg-slate-900 px-3 py-1.5 text-white" :disabled="busy || !roleKey">保存</button>
              </form>
              <button type="button" class="mt-2 text-xs underline" @click="open = null">取消</button>
            </div>
          </li>
        </ul>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
  </div>
</template>
