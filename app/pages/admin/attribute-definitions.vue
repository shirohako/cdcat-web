<script setup lang="ts">
import type { AdminAttributeDefinition } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const VALUE_TYPES = ['text', 'integer', 'decimal', 'date', 'url', 'boolean', 'choice', 'reference'] as const
const SUBJECTS = ['album', 'track', 'album_image', 'artist', 'label'] as const
const REFERENCE_TYPES = ['album', 'artist', 'label', 'entry', 'franchise'] as const
const LANGUAGES = ['zh-Hans', 'en', 'ja', 'zh-Hant'] as const

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const { data, pending, error, refresh } = await useAsyncData('admin-attribute-definitions', () => $api<AdminAttributeDefinition[]>('/v1/admin/attribute-definitions'))
const definitions = computed(() => data.value ?? [])

const texts = () => ({ 'zh-Hans': '', en: '', ja: '', 'zh-Hant': '' }) as Record<string, string>
const empty = () => ({
  key: '', names: texts(), description: texts(), group: 'general', value_type: 'text', choices: [] as Array<{ value: string, names: Record<string, string> }>,
  reference_types: [] as string[], applies_to: ['album'] as string[], is_multiple: false, sort_order: 0, is_active: true, reason: '',
})
const form = reactive(empty())
const editing = ref<string | null>(null)
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')

const open = (definition?: AdminAttributeDefinition) => {
  message.value = ''
  Object.assign(form, empty())
  editing.value = definition?.key ?? null
  if (definition) {
    Object.assign(form, {
      key: definition.key, names: { ...texts(), ...definition.names }, description: { ...texts(), ...(definition.description ?? {}) },
      group: definition.group ?? '', value_type: definition.value_type,
      choices: (definition.choices ?? []).map(choice => ({ value: choice.value, names: { ...texts(), ...choice.names } })),
      reference_types: [...(definition.reference_types ?? [])], applies_to: [...definition.applies_to], is_multiple: definition.is_multiple,
      sort_order: definition.sort_order, is_active: definition.is_active,
    })
  } else {
    form.sort_order = Math.max(0, ...definitions.value.map(item => item.sort_order)) + 10
  }
  formOpen.value = true
}

const filled = (value: Record<string, string>) => Object.fromEntries(Object.entries(value).filter(([, text]) => text.trim()).map(([key, text]) => [key, text.trim()]))
const toggle = (list: string[], value: string) => {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}

const save = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      names: filled(form.names), description: filled(form.description), group: form.group.trim() || null, value_type: form.value_type,
      choices: form.value_type === 'choice' ? form.choices.filter(choice => choice.value.trim()).map(choice => ({ value: choice.value.trim(), names: filled(choice.names) })) : null,
      reference_types: form.value_type === 'reference' ? form.reference_types : null,
      applies_to: form.applies_to, is_multiple: form.is_multiple, sort_order: form.sort_order, is_active: form.is_active, reason: form.reason.trim() || null,
    }
    await $api(editing.value ? `/v1/admin/attribute-definitions/${editing.value}` : '/v1/admin/attribute-definitions', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? body : { ...body, key: form.key.trim() },
    })
    formOpen.value = false
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

const deleting = ref<AdminAttributeDefinition | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (value) => { if (!value) deleting.value = null } })
const remove = async (reason: string) => {
  const definition = deleting.value
  if (!definition) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/attribute-definitions/${definition.key}`, { method: 'DELETE', body: { reason } })
    notice.value = t('admin_pages.attribute_definitions.deleted', { key: definition.key })
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    deleting.value = null
    busy.value = false
  }
}

useHead({ title: computed(() => t('admin_pages.attribute_definitions.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.attribute_definitions.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600">{{ t('admin_pages.attribute_definitions.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="open()">{{ t('admin_pages.attribute_definitions.create') }}</button>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-300 bg-white p-5">
      <h2 class="font-semibold">{{ editing ? t('admin_pages.attribute_definitions.edit', { key: editing }) : t('admin_pages.attribute_definitions.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">{{ t('admin_pages.attribute_definitions.key') }}
          <input v-model="form.key" :disabled="!!editing" required pattern="[a-z][a-z0-9_]{1,49}" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono disabled:bg-slate-100">
          <span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.attribute_definitions.key_help') }}</span>
        </label>
        <label class="block">{{ t('admin_pages.attribute_definitions.group') }}
          <input v-model="form.group" pattern="[a-z0-9_-]*" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono">
        </label>
        <label v-for="language in LANGUAGES" :key="`n-${language}`" class="block">{{ t('admin_pages.attribute_definitions.name_in', { language }) }}<span v-if="language === 'en'" class="text-red-600"> *</span>
          <input v-model="form.names[language]" :required="language === 'en'" maxlength="100" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label v-for="language in LANGUAGES" :key="`d-${language}`" class="block">{{ t('admin_pages.attribute_definitions.description_in', { language }) }}
          <textarea v-model="form.description[language]" rows="2" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <p class="text-xs text-slate-500 sm:col-span-2">{{ t('admin_pages.attribute_definitions.description_help') }}</p>
        <label class="block">{{ t('admin_pages.attribute_definitions.value_type') }}
          <select v-model="form.value_type" :disabled="!!editing && (definitions.find(item => item.key === editing)?.values_count ?? 0) > 0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100">
            <option v-for="value in VALUE_TYPES" :key="value" :value="value">{{ t(`admin_pages.attribute_definitions.value_types.${value}`) }}</option>
          </select>
        </label>
        <div class="flex items-end gap-4 pb-2">
          <label class="flex items-center gap-1.5"><input v-model="form.is_multiple" type="checkbox">{{ t('admin_pages.attribute_definitions.is_multiple') }}</label>
          <label class="flex items-center gap-1.5"><input v-model="form.is_active" type="checkbox">{{ t('admin_pages.credit_roles.active') }}</label>
        </div>
        <fieldset class="sm:col-span-2">
          <legend>{{ t('admin_pages.attribute_definitions.applies_to') }}</legend>
          <div class="mt-1 flex flex-wrap gap-4">
            <label v-for="subject in SUBJECTS" :key="subject" class="flex items-center gap-1.5"><input type="checkbox" :checked="form.applies_to.includes(subject)" @change="toggle(form.applies_to, subject)">{{ t(`admin_pages.attribute_definitions.subjects.${subject}`) }}</label>
          </div>
        </fieldset>
        <fieldset v-if="form.value_type === 'reference'" class="sm:col-span-2">
          <legend>{{ t('admin_pages.attribute_definitions.reference_types') }}</legend>
          <div class="mt-1 flex flex-wrap gap-4">
            <label v-for="type in REFERENCE_TYPES" :key="type" class="flex items-center gap-1.5"><input type="checkbox" :checked="form.reference_types.includes(type)" @change="toggle(form.reference_types, type)">{{ t(`admin_pages.types.${type}`) }}</label>
          </div>
        </fieldset>
        <fieldset v-if="form.value_type === 'choice'" class="space-y-2 sm:col-span-2">
          <legend>{{ t('admin_pages.attribute_definitions.choices') }}</legend>
          <div v-for="(choice, index) in form.choices" :key="index" class="flex flex-wrap gap-2">
            <input v-model="choice.value" required pattern="[a-z0-9_-]+" :placeholder="t('admin_pages.attribute_definitions.choice_value')" class="w-36 rounded-lg border border-slate-300 px-3 py-2 font-mono">
            <input v-model="choice.names['zh-Hans']" :placeholder="t('admin_pages.attribute_definitions.name_in', { language: 'zh-Hans' })" class="w-40 rounded-lg border border-slate-300 px-3 py-2">
            <input v-model="choice.names.en" required :placeholder="t('admin_pages.attribute_definitions.name_in', { language: 'en' })" class="w-40 rounded-lg border border-slate-300 px-3 py-2">
            <button type="button" class="text-red-700" @click="form.choices.splice(index, 1)">{{ t('common.delete') }}</button>
          </div>
          <button type="button" class="rounded-lg border px-3 py-1.5" @click="form.choices.push({ value: '', names: texts() })">{{ t('admin_pages.attribute_definitions.add_choice') }}</button>
        </fieldset>
        <label class="block">{{ t('admin_pages.credit_roles.sort_order') }}
          <input v-model.number="form.sort_order" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <label class="block">{{ t('admin_pages.optional_reason') }}
          <input v-model="form.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
        </label>
        <p v-if="message" role="alert" class="text-red-700 sm:col-span-2">{{ message }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="busy || !form.applies_to.length" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('common.save') }}</button>
          <button type="button" class="rounded-lg border px-4 py-2" @click="formOpen = false">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!definitions.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('admin_pages.attribute_definitions.key') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.attribute_definitions.names') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.attribute_definitions.value_type') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.attribute_definitions.applies_to') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.attribute_definitions.values_count') }}</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="definition in definitions" :key="definition.key" :class="{ 'opacity-50': !definition.is_active }">
                <td class="px-4 py-3 font-mono text-xs">{{ definition.key }}<span v-if="!definition.is_active" class="ml-1 font-sans text-slate-500">（{{ t('admin_pages.credit_roles.inactive') }}）</span></td>
                <td class="px-3 py-3">{{ definition.names['zh-Hans'] || definition.names.en }}<p class="max-w-sm truncate text-xs text-slate-500">{{ definition.description?.['zh-Hans'] || definition.description?.en }}</p></td>
                <td class="px-3 py-3 text-xs">{{ t(`admin_pages.attribute_definitions.value_types.${definition.value_type}`) }}<template v-if="definition.is_multiple"> · {{ t('admin_pages.attribute_definitions.is_multiple') }}</template></td>
                <td class="px-3 py-3 text-xs">{{ definition.applies_to.map(subject => t(`admin_pages.attribute_definitions.subjects.${subject}`)).join('、') }}</td>
                <td class="px-3 py-3 text-xs tabular-nums">{{ definition.values_count }}</td>
                <td class="px-3 py-3 text-right text-xs">
                  <button type="button" class="underline" @click="open(definition)">{{ t('common.edit') }}</button>
                  <button type="button" class="ml-3 text-red-700 underline disabled:opacity-40" :disabled="definition.values_count > 0" :title="definition.values_count ? t('admin_pages.attribute_definitions.in_use') : undefined" @click="deleting = definition">{{ t('common.delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.attribute_definitions.delete_title', { key: deleting?.key ?? '' })" :description="t('admin_pages.attribute_definitions.delete_help')" @confirm="remove" />
  </div>
</template>
