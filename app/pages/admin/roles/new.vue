<script setup lang="ts">
import type { AdminPermission } from '~/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
const { data, pending, error, refresh } = await useAsyncData('admin-permission-catalog', () => $api<AdminPermission[]>('/v1/admin/permissions/catalog'))
useHead({ title: '新建角色' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8"><h1 class="text-3xl font-bold">新建角色</h1><AdminListState :pending="pending" :error="error" @retry="refresh()"><AdminRoleEditor v-if="data" :catalog="data" /></AdminListState></div>
</template>
