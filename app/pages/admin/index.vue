<script setup lang="ts">
import { adminMenu } from '~/config/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const firstPage = adminMenu.find(item => hasPermission(item.permission))
if (firstPage) await navigateTo(firstPage.path, { replace: true })
</script>

<template>
  <div class="p-8 text-sm text-slate-600">{{ t('admin_pages.no_modules') }}</div>
</template>
