<script setup lang="ts">
import type { AdminCreditRole } from '~/types/admin'
import type { HarvestIdentity, HarvestPagination } from '~/types/harvest'

/** The name map; with the page's event_id, only names candidates linked to that event use. */
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
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
    notice.value = t('admin_pages.harvest.names.done', { count: result.rebuilt })
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
    <p class="max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.names.description') }}</p>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="value in (['person', 'circle', 'role'] as const)" :key="value" type="button" class="rounded-full px-3 py-1" :class="kind === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="kind = value">
        {{ t(`admin_pages.harvest.names.kinds.${value}`) }}
      </button>
      <select v-model="status" class="rounded-lg border border-slate-300 px-2 py-1.5">
        <option v-for="value in ['unresolved', 'resolved', 'ignored', 'all']" :key="value" :value="value">{{ t(`admin_pages.harvest.names.statuses.${value}`) }}</option>
      </select>
      <input v-model.lazy="q" type="search" :placeholder="t('admin_pages.harvest.names.search')" class="w-56 rounded-lg border border-slate-300 px-2 py-1.5">
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
                  <span class="ml-1 text-xs font-normal text-slate-500">{{ t(`admin_pages.harvest.names.kind_label.${identity.kind}`) }}<template v-if="identity.kind === 'shop_account'"> {{ identity.key }}</template></span>
                </p>
                <p class="text-xs text-slate-500">
                  {{ t(`admin_pages.harvest.names.status.${identity.status}`) }}
                  <template v-if="identity.artist"> {{ t('admin_pages.harvest.names.linked_to', { name: identity.artist.name }) }}</template>
                  <template v-if="identity.credit_role"> {{ t('admin_pages.harvest.names.linked_to', { name: roleName(identity.credit_role) }) }}</template>
                  · {{ t('admin_pages.harvest.names.occurrences', { count: identity.occurrences }) }}
                </p>
                <p v-if="identity.candidates.length" class="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-600">
                  {{ t('admin_pages.harvest.names.used_in') }}
                  <NuxtLink v-for="candidate in identity.candidates" :key="candidate.id" :to="`/admin/harvest/review/${candidate.id}`" class="max-w-56 truncate text-sky-700 hover:underline">{{ candidate.title }}</NuxtLink>
                </p>
              </div>
              <div class="flex flex-wrap gap-3 text-xs">
                <template v-if="identity.kind === 'role'">
                  <button type="button" class="underline" @click="start(identity, 'role')">{{ t('admin_pages.harvest.names.role') }}</button>
                </template>
                <template v-else>
                  <button type="button" class="underline" @click="start(identity, 'link')">{{ t('admin_pages.harvest.names.link') }}</button>
                  <button type="button" class="underline" @click="start(identity, 'create')">{{ t('admin_pages.harvest.names.create') }}</button>
                </template>
                <button v-if="identity.status !== 'ignored'" type="button" class="underline" :disabled="busy" @click="resolve(identity, { action: 'ignore' })">{{ t('admin_pages.harvest.names.ignore') }}</button>
                <button v-if="identity.status !== 'unresolved'" type="button" class="underline" :disabled="busy" @click="resolve(identity, { action: 'reset' })">{{ t('admin_pages.harvest.names.reset') }}</button>
              </div>
            </div>
            <div v-if="open?.id === identity.id" class="mt-3 rounded-lg bg-slate-50 p-3">
              <EditorEntityPicker v-if="open.mode === 'link'" kind="artist" :placeholder="t('admin_pages.harvest.names.pick_artist')" class="max-w-md" @select="resolve(identity, { action: 'link', artist_id: $event.id })" />
              <form v-else-if="open.mode === 'create'" class="flex flex-wrap items-end gap-2 text-xs" @submit.prevent="resolve(identity, { action: 'create', name: createForm.name, artist_type: createForm.type })">
                <label>{{ t('admin_pages.harvest.names.create_name') }}<input v-model="createForm.name" required maxlength="255" class="mt-1 block w-64 rounded border border-slate-300 px-2 py-1"></label>
                <label>{{ t('admin_pages.harvest.names.create_type') }}
                  <select v-model="createForm.type" class="mt-1 block rounded border border-slate-300 px-2 py-1">
                    <option v-for="type in artistTypes" :key="type" :value="type">{{ t(`admin_pages.content.artist_types.${type}`) }}</option>
                  </select>
                </label>
                <button type="submit" class="rounded bg-slate-900 px-3 py-1.5 text-white" :disabled="busy">{{ t('admin_pages.harvest.names.create') }}</button>
              </form>
              <form v-else class="flex flex-wrap items-end gap-2 text-xs" @submit.prevent="resolve(identity, { action: 'role', credit_role: roleKey })">
                <select v-model="roleKey" required class="rounded border border-slate-300 px-2 py-1">
                  <option value="">{{ t('admin_pages.harvest.names.pick_role') }}</option>
                  <option v-for="role in roles ?? []" :key="role.key" :value="role.key">{{ role.names['zh-Hans'] ?? role.key }}（{{ role.key }}）</option>
                </select>
                <button type="submit" class="rounded bg-slate-900 px-3 py-1.5 text-white" :disabled="busy || !roleKey">{{ t('common.save') }}</button>
              </form>
              <button type="button" class="mt-2 text-xs underline" @click="open = null">{{ t('common.cancel') }}</button>
            </div>
          </li>
        </ul>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
  </div>
</template>
