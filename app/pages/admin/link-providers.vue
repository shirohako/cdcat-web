<script setup lang="ts">
import type { AdminLinkProvider } from '~/types/admin'
import type { DeletionImpact } from '~/types/revision'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { data, pending, error, refresh } = await useAsyncData('admin-link-providers', () => $api<AdminLinkProvider[]>('/v1/admin/link-providers'))

const empty = () => ({ id: 0, name: '', category: 'other', icon_url: '', url_pattern: '', sort_order: 0 })
const form = reactive(empty())
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')
const edit = (provider?: AdminLinkProvider) => {
  Object.assign(form, provider ? { ...provider, icon_url: provider.icon_url ?? '', url_pattern: provider.url_pattern ?? '' } : empty())
  message.value = ''
  formOpen.value = true
}
const save = async () => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  try {
    const body = { name: form.name, category: form.category, icon_url: form.icon_url || null, url_pattern: form.url_pattern || null, sort_order: Number(form.sort_order) || 0 }
    await $api(form.id ? `/v1/admin/link-providers/${form.id}` : '/v1/admin/link-providers', { method: form.id ? 'PUT' : 'POST', body })
    formOpen.value = false
    notice.value = '已保存'
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminLinkProvider | null>(null)
const impact = ref<DeletionImpact | null>(null)
const deleteOpen = ref(false)
const startDelete = async (provider: AdminLinkProvider) => {
  message.value = ''
  try {
    impact.value = await $api<DeletionImpact>(`/v1/admin/content/link-providers/${provider.id}/deletion-impact`)
    deleting.value = provider
    deleteOpen.value = true
  } catch (e) {
    message.value = adminError(e)
  }
}
const confirmDelete = async (reason: string) => {
  if (busy.value || !deleting.value || !impact.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/link-providers/${deleting.value.id}`, { method: 'DELETE', body: { reason, impact_checksum: impact.value.checksum } })
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    message.value = adminError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
useHead({ title: '链接提供方' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">链接提供方</h1>
        <p class="mt-2 text-sm text-slate-600">维护外部链接的名称、图标、类别、URL 规则和显示顺序。仍被引用的提供方不能删除。</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="edit()">新建提供方</button>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ form.id ? '编辑提供方' : '新建提供方' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">名称<input v-model="form.name" required maxlength="255" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="block">类别<input v-model="form.category" required maxlength="50" pattern="[a-z0-9_\-]+" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><span class="mt-1 block text-xs text-slate-500">小写字母、数字、下划线或连字符，例如 streaming、shop、social。</span></label>
        <label class="block">图标<input v-model="form.icon_url" maxlength="2048" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="block">URL 规则<input v-model="form.url_pattern" maxlength="2048" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="block">显示顺序<input v-model.number="form.sort_order" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <div class="flex items-end justify-end gap-2 sm:col-span-2">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="formOpen = false">取消</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? '保存中…' : '保存' }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-175 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr><th class="px-4 py-3">显示顺序</th><th class="px-4 py-3">名称</th><th class="px-4 py-3">类别</th><th class="px-4 py-3">URL 规则</th><th class="px-4 py-3">引用数</th><th class="px-4 py-3" /></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="provider in data" :key="provider.id">
                <td class="px-4 py-3 tabular-nums">{{ provider.sort_order }}</td>
                <td class="px-4 py-3 font-medium">{{ provider.name }}<p v-if="provider.icon_url" class="truncate text-xs font-normal text-slate-500">{{ provider.icon_url }}</p></td>
                <td class="px-4 py-3">{{ provider.category }}</td>
                <td class="max-w-60 truncate px-4 py-3 font-mono text-xs">{{ provider.url_pattern || '—' }}</td>
                <td class="px-4 py-3 tabular-nums">{{ provider.links_count }}</td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><button type="button" class="underline" @click="edit(provider)">编辑</button><button type="button" class="text-red-700" @click="startDelete(provider)">删除</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :confirm-disabled="Boolean(impact?.blockers.length)" :title="`删除“${deleting?.name ?? ''}”`" @confirm="confirmDelete">
      <AdminImpactPreview v-if="impact" :impact="impact" />
    </AdminConfirmDialog>
  </div>
</template>
