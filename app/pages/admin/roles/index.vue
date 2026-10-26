<script setup lang="ts">
import type { AdminRole } from '~/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
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
  } catch (error) { message.value = adminError(error) }
  finally { busy.value = false }
}
useHead({ title: '角色与权限' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header class="flex flex-wrap items-center justify-between gap-4"><div><h1 class="text-3xl font-bold">角色与权限</h1><p class="mt-2 text-sm text-slate-600">设置角色等级和权限，权限项由代码定义。</p></div><NuxtLink to="/admin/roles/new" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">新建角色</NuxtLink></header>
    <p class="text-sm text-slate-500">staff（管理员）受保护；member 不能改名或删除。</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.length" @retry="refresh()">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-600"><tr><th class="p-4">角色名称</th><th class="p-4">角色等级</th><th class="p-4">使用人数</th><th class="p-4">权限矩阵</th><th class="p-4" /></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="role in data" :key="role.id"><td class="p-4 font-medium">{{ role.name }}</td><td class="p-4">{{ role.level }}</td><td class="p-4">{{ role.users_count }}</td><td class="p-4">{{ role.permissions.length }} 项权限</td><td class="flex gap-3 p-4"><NuxtLink :to="`/admin/roles/${role.id}`" class="underline">{{ role.can_manage ? '编辑角色' : '查看角色' }}</NuxtLink><button v-if="role.can_delete" type="button" class="text-red-700" @click="remove(role)">删除角色</button></td></tr></tbody></table></div>
    </AdminListState>
    <AdminConfirmDialog v-model="open" title="删除角色并替换用户角色" :busy="busy" reason-required :confirm-disabled="Boolean(selected?.users_count && !replacement)" @confirm="confirm">
      <p v-if="selected?.users_count" class="mt-4 text-sm text-amber-800">该角色正被 {{ selected.users_count }} 位用户使用，必须选择替代角色。</p>
      <label class="mt-4 block text-sm">替代角色<select v-model="replacement" :disabled="busy" class="mt-2 w-full rounded-lg border p-2"><option value="">不替换（仅适用于无人使用的角色）</option><option v-for="role in replacements" :key="role.id" :value="String(role.id)">{{ role.name }}</option></select></label>
      <p v-if="message" role="alert" class="mt-3 text-sm text-red-700">{{ message }}</p>
    </AdminConfirmDialog>
  </div>
</template>
