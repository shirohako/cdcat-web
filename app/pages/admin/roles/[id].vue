<script setup lang="ts">
import type { AdminPermission, AdminRole } from '~/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const route = useRoute()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { data, pending, error, refresh } = await useAsyncData(() => `admin-role-${route.params.id}`, async () => {
  const [roles, catalog] = await Promise.all([$api<AdminRole[]>('/v1/admin/roles'), $api<AdminPermission[]>('/v1/admin/permissions/catalog')])
  const role = roles.find(role => String(role.id) === String(route.params.id))
  if (!role) throw createError({ statusCode: 404 })
  return { role, catalog }
}, { watch: [() => route.params.id] })
useHead({ title: computed(() => `${t('admin_pages.roles.edit')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8"><h1 class="text-3xl font-bold">{{ t(data?.role.can_manage ? 'admin_pages.roles.edit' : 'admin_pages.roles.view') }}</h1><AdminListState :pending="pending" :error="error" @retry="refresh()"><AdminRoleEditor v-if="data" :key="data.role.id" :role="data.role" :catalog="data.catalog" /></AdminListState></div>
</template>
