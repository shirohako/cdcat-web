<script setup lang="ts">
import type { AdminCreditRole } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// 署名与发行 (release) holds only the reserved roles, so new roles can't pick it.
const CATEGORIES = ['composition', 'lyrics', 'arrangement', 'vocals', 'performance', 'production', 'engineering', 'artwork', 'other'] as const
const LANGUAGES = ['zh-Hans', 'en', 'ja', 'zh-Hant', 'ko'] as const
const LEVELS = ['is_album_role', 'is_track_role'] as const

const { $api } = useNuxtApp()
const levelLabels: Record<typeof LEVELS[number], string> = { 'is_album_role': '专辑', 'is_track_role': '曲目' }
const creditRoleCategoryLabels: Record<string, string> = {
  release: '署名与发行',
  composition: '作曲',
  lyrics: '作词',
  arrangement: '编曲',
  vocals: '演唱',
  performance: '演奏',
  production: '制作',
  engineering: '录音与混音',
  artwork: '美术',
  other: '其他',
}

const { data, pending, error, refresh } = await useAsyncData('admin-credit-roles', () => $api<AdminCreditRole[]>('/v1/admin/credit-roles'))
const roles = computed(() => data.value ?? [])
const category = ref('')
const shown = computed(() => roles.value.filter(role => !category.value || role.category === category.value))

const empty = () => ({
  key: '', category: 'composition', names: { 'zh-Hans': '', en: '', ja: '', 'zh-Hant': '', ko: '' } as Record<string, string>, aliases: '',
  is_album_role: true, is_track_role: true, sort_order: 0, is_active: true, reason: '',
})
const form = reactive(empty())
const editing = ref<string | null>(null)
/** Editing a 署名与发行 role: its category, levels and 启用 stay as they are. */
const reserved = computed(() => roles.value.some(role => role.key === editing.value && role.is_reserved))
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')

const open = (role?: AdminCreditRole) => {
  message.value = ''
  Object.assign(form, empty())
  editing.value = role?.key ?? null
  if (role) {
    Object.assign(form, {
      key: role.key, category: role.category, names: { ...form.names, ...role.names }, aliases: (role.aliases ?? []).join(', '),
      is_album_role: role.is_album_role, is_track_role: role.is_track_role, sort_order: role.sort_order, is_active: role.is_active,
    })
  } else {
    form.sort_order = Math.max(0, ...roles.value.map(item => item.sort_order)) + 10
  }
  formOpen.value = true
}

const save = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      category: form.category,
      names: Object.fromEntries(Object.entries(form.names).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])),
      aliases: form.aliases.split(/[,，]/).map(alias => alias.trim()).filter(Boolean),
      is_album_role: form.is_album_role, is_track_role: form.is_track_role,
      sort_order: form.sort_order, is_active: form.is_active, reason: form.reason.trim() || null,
    }
    await $api(editing.value ? `/v1/admin/credit-roles/${editing.value}` : '/v1/admin/credit-roles', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? body : { ...body, key: form.key.trim() },
    })
    formOpen.value = false
    notice.value = '已保存'
    await refresh()
  } catch (failure) {
    message.value = adminError(failure)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminCreditRole | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (value) => { if (!value) deleting.value = null } })
const remove = async (reason: string) => {
  const role = deleting.value
  if (!role) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/credit-roles/${role.key}`, { method: 'DELETE', body: { reason } })
    notice.value = `已删除角色 ${role.key}`
    await refresh()
  } catch (failure) {
    message.value = adminError(failure)
  } finally {
    deleting.value = null
    busy.value = false
  }
}

const used = (role: AdminCreditRole) => role.usage.album + role.usage.track
useHead({ title: '角色字典' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">角色字典</h1>
        <p class="mt-2 text-sm text-slate-600">制作人员可选的角色（作曲、编曲、Vocal……）。key 创建后不能改；被使用的角色不能删除，可以停用。</p>
      </div>
      <UiButton variant="primary" @click="open()">新建角色</UiButton>
    </header>

    <AdminFilterBar>
      <select v-model="category" aria-label="分类" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">全部分类</option>
        <option value="release">{{ creditRoleCategoryLabels.release }}</option>
        <option v-for="value in CATEGORIES" :key="value" :value="value">{{ creditRoleCategoryLabels[value] }}</option>
      </select>
    </AdminFilterBar>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? `编辑角色 ${editing}` : '新建角色' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">Key
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,39}" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono disabled:bg-slate-100">
          <span class="mt-1 block text-xs text-slate-500">小写字母开头，可含数字和下划线，如 composer。</span>
        </label>
        <label class="block">分类
          <select v-model="form.category" :disabled="reserved" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100">
            <option v-if="reserved" value="release">{{ creditRoleCategoryLabels.release }}</option>
            <option v-for="value in CATEGORIES" :key="value" :value="value">{{ creditRoleCategoryLabels[value] }}</option>
          </select>
          <span v-if="reserved" class="mt-1 block text-xs text-slate-500">系统保留的「署名与发行」角色：只能改名称、别名和排序。</span>
        </label>
        <label v-for="language in LANGUAGES" :key="language" class="block">名称（{{ language }}）<span v-if="language === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[language]" :required="language === 'en'" maxlength="100" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="block sm:col-span-2">别名
          <input v-model="form.aliases" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Composition, 作曲">
          <span class="mt-1 block text-xs text-slate-500">其他网站上的写法，以后导入数据时用来对应到这个角色，用逗号分隔。</span>
        </label>
        <fieldset class="sm:col-span-2">
          <legend>可用层级</legend>
          <div class="mt-1 flex flex-wrap gap-4">
            <label v-for="level in LEVELS" :key="level" class="flex items-center gap-1.5"><input v-model="form[level]" type="checkbox" :disabled="reserved">{{ levelLabels[level] }}</label>
          </div>
          <span class="mt-1 block text-xs text-slate-500">专辑层级的角色记在整张专辑上，曲目层级的角色记在单个曲目上。</span>
        </fieldset>
        <label class="block">排序
          <input v-model.number="form.sort_order" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="flex items-center gap-1.5 self-end pb-2"><input v-model="form.is_active" type="checkbox" :disabled="reserved">启用</label>
        <label class="block sm:col-span-2">原因（可选，写入操作日志）
          <input v-model="form.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <UiButton type="submit" variant="primary" :disabled="busy">保存</UiButton>
          <UiButton @click="formOpen = false">取消</UiButton>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!shown.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">Key</th>
                <th class="px-3 py-3">名称</th>
                <th class="px-3 py-3">分类</th>
                <th class="px-3 py-3">可用层级</th>
                <th class="px-3 py-3">使用（专辑 / 曲目）</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="role in shown" :key="role.key" :class="{ 'opacity-50': !role.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ role.key }}<span v-if="role.is_reserved" class="ml-1 font-sans text-slate-500">（系统保留）</span><span v-if="!role.is_active" class="ml-1 font-sans text-slate-500">（已停用）</span></td>
                <td class="px-3 py-3">{{ role.names['zh-Hans'] || role.names.en }} <span class="text-xs text-slate-500">{{ role.names.en }}</span></td>
                <td class="px-3 py-3 text-xs">{{ creditRoleCategoryLabels[role.category] }}</td>
                <td class="px-3 py-3 text-xs">{{ LEVELS.filter(level => role[level]).map(level => levelLabels[level]).join(' · ') }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ role.usage.album }} / {{ role.usage.track }}</td>
                <td class="px-3 py-3 text-right text-xs">
                  <UiButton size="xs" @click="open(role)">编辑</UiButton>
                  <UiButton variant="danger-soft" size="xs" class="ml-2" :disabled="role.is_reserved || used(role) > 0" :title="role.is_reserved ? '系统保留的角色，不能删除。' : used(role) ? '已有署名使用这个角色，只能停用。' : undefined" @click="deleting = role">删除</UiButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除角色 ${deleting?.key ?? ''}`" description="只有从未被使用的角色可以删除。" @confirm="remove" />
  </div>
</template>
