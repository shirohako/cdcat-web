<script setup lang="ts">
import type { AdminPermission, AdminRole } from '~/types/admin'
const props = defineProps<{ role?: AdminRole, catalog: AdminPermission[] }>()
const { $api } = useNuxtApp()
const { user } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const router = useRouter()
const form = reactive({ name: props.role?.name ?? '', level: props.role?.level ?? 0, permissions: [...(props.role?.permissions ?? [])] })
const busy = ref(false)
const message = ref('')
const readOnly = computed(() => props.role ? !props.role.can_manage : false)
const groups = computed(() => [...new Set(props.catalog.map(permission => permission.group))].map(name => ({ name, items: props.catalog.filter(permission => permission.group === name) })))
const maxLevel = computed(() => user.value?.roles === 'founder' ? 2147483647 : Math.max(0, (user.value?.role_level ?? 0) - 1))
const save = async () => {
  if (busy.value || readOnly.value) return
  busy.value = true
  message.value = ''
  try {
    await $api(props.role ? `/v1/admin/roles/${props.role.id}` : '/v1/admin/roles', { method: props.role ? 'PUT' : 'POST', body: form })
    await router.push('/admin/roles')
  } catch (error) {
    message.value = (error as { status?: number }).status === 422 ? t('admin_pages.roles.invalid') : localizeError(error)
  } finally { busy.value = false }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="save">
    <div class="rounded-xl border border-slate-200 bg-white p-5">
      <p v-if="readOnly" class="mb-4 text-sm text-amber-800">{{ t('admin_pages.roles.read_only') }}</p>
      <div class="grid gap-5 md:grid-cols-2">
        <label class="block text-sm">{{ t('admin_pages.roles.name') }}<input v-model="form.name" required pattern="[a-z][a-z0-9_-]*" maxlength="64" :disabled="busy || readOnly || role?.name === 'member'" class="mt-2 w-full rounded-lg border p-2.5 disabled:bg-slate-50"><span class="mt-2 block text-xs text-slate-500">{{ t('admin_pages.roles.name_help') }}</span></label>
        <label class="block text-sm">{{ t('admin_pages.roles.level') }}<input v-model.number="form.level" required type="number" min="0" :max="maxLevel" :disabled="busy || readOnly" class="mt-2 w-full rounded-lg border p-2.5 disabled:bg-slate-50"><span class="mt-2 block text-xs text-slate-500">{{ t('admin_pages.roles.limits') }}</span></label>
      </div>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ t('admin_pages.roles.permissions') }}</h2><p class="mt-2 text-sm text-slate-500">{{ t('admin_pages.roles.selected_count', { count: form.permissions.length }) }}</p>
      <div class="mt-5 grid gap-6 md:grid-cols-2">
        <fieldset v-for="group in groups" :key="group.name" class="rounded-lg border p-4"><legend class="px-2 text-sm font-semibold">{{ group.name }}</legend>
          <label v-for="permission in group.items" :key="permission.name" class="mb-3 flex items-start gap-3 text-sm last:mb-0"><input v-model="form.permissions" type="checkbox" :value="permission.name" :disabled="busy || readOnly || !permission.assignable" class="mt-1 size-4"><span>{{ permission.description }}<span class="mt-0.5 block text-xs text-slate-500">{{ permission.name }}</span></span></label>
        </fieldset>
      </div>
    </div>
    <p v-if="message" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ message }}</p>
    <div class="flex gap-3"><button v-if="!readOnly" type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-5 py-2.5 text-sm text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button><NuxtLink to="/admin/roles" class="rounded-lg border bg-white px-5 py-2.5 text-sm">{{ t('admin_pages.back_list') }}</NuxtLink></div>
  </form>
</template>
