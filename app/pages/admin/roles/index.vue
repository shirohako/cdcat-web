<script setup lang="ts">
import type { AdminRole } from '~/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const { data, pending, error, refresh } = await useAsyncData('admin-role-management', () => $api<AdminRole[]>('/v1/admin/roles'))
const selected = ref<AdminRole | null>(null)
const replacement = ref('')
const open = ref(false)
const busy = ref(false)
const message = ref('')
const replacements = computed(() => (data.value ?? []).filter(role => role.id !== selected.value?.id && role.can_manage))
const remove = (role: AdminRole) => { selected.value = role; replacement.value = ''; message.value = ''; open.value = true }
const confirm = async (reason: string) => {
  if (!selected.value || busy.value) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/roles/${selected.value.id}`, { method: 'DELETE', body: { reason, replacement_role_id: Number(replacement.value) || null } })
    open.value = false
    await refresh()
  } catch (error) { message.value = localizeError(error) }
  finally { busy.value = false }
}
useHead({ title: computed(() => t('admin_pages.roles.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header class="flex flex-wrap items-center justify-between gap-4"><div><h1 class="text-3xl font-bold">{{ t('admin_pages.roles.title') }}</h1><p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.roles.description') }}</p></div><NuxtLink to="/admin/roles/new" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{{ t('admin_pages.roles.create') }}</NuxtLink></header>
    <p class="text-sm text-slate-500">{{ t('admin_pages.roles.reserved') }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.length" @retry="refresh()">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-600"><tr><th class="p-4">{{ t('admin_pages.roles.name') }}</th><th class="p-4">{{ t('admin_pages.roles.level') }}</th><th class="p-4">{{ t('admin_pages.roles.users_count') }}</th><th class="p-4">{{ t('admin_pages.roles.permissions') }}</th><th class="p-4" /></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="role in data" :key="role.id"><td class="p-4 font-medium">{{ role.name }}</td><td class="p-4">{{ role.level }}</td><td class="p-4">{{ role.users_count }}</td><td class="p-4">{{ t('admin_pages.users.permissions_count', { count: role.permissions.length }) }}</td><td class="flex gap-3 p-4"><NuxtLink :to="`/admin/roles/${role.id}`" class="underline">{{ t(role.can_manage ? 'admin_pages.roles.edit' : 'admin_pages.roles.view') }}</NuxtLink><button v-if="role.can_delete" type="button" class="text-red-700" @click="remove(role)">{{ t('admin_pages.roles.delete') }}</button></td></tr></tbody></table></div>
    </AdminListState>
    <AdminConfirmDialog v-model="open" :title="t('admin_pages.roles.delete_title')" :busy="busy" reason-required :confirm-disabled="Boolean(selected?.users_count && !replacement)" @confirm="confirm">
      <p v-if="selected?.users_count" class="mt-4 text-sm text-amber-800">{{ t('admin_pages.roles.replacement_required', { count: selected.users_count }) }}</p>
      <label class="mt-4 block text-sm">{{ t('admin_pages.roles.replacement') }}<select v-model="replacement" :disabled="busy" class="mt-2 w-full rounded-lg border p-2"><option value="">{{ t('admin_pages.roles.no_replacement') }}</option><option v-for="role in replacements" :key="role.id" :value="String(role.id)">{{ role.name }}</option></select></label>
      <p v-if="message" role="alert" class="mt-3 text-sm text-red-700">{{ message }}</p>
    </AdminConfirmDialog>
  </div>
</template>
