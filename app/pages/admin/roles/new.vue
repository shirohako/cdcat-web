<script setup lang="ts">
import type { AdminPermission } from '~/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { data, pending, error, refresh } = await useAsyncData('admin-permission-catalog', () => $api<AdminPermission[]>('/v1/admin/permissions/catalog'))
useHead({ title: computed(() => t('admin_pages.roles.create')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8"><h1 class="text-3xl font-bold">{{ t('admin_pages.roles.create') }}</h1><AdminListState :pending="pending" :error="error" @retry="refresh()"><AdminRoleEditor v-if="data" :catalog="data" /></AdminListState></div>
</template>
