<script setup lang="ts">
import type { CreditRoleDefinition } from '~/types/catalog'
import { ALBUM_ONLY_ROLES, COMMON_ROLES } from '~/utils/creditLines'
import { foldRoleWord } from '~/utils/creditParser'

/**
 * The roles of a credit line, as a select-like button ("作曲、编曲") that opens a list to tick them in: the common
 * ones first, then the whole dictionary by group, searchable by every language's name and the other spellings. One
 * role at least stays ticked. Roles only the whole album has (发行、厂牌 …) belong in the byline block and are not
 * offered.
 */
const model = defineModel<string[]>({ required: true })
defineProps<{ invalid?: boolean }>()

const { t } = useI18n()
const { separator } = useListPunctuation()
const { schema, roleName, roleNameEn } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const query = ref('')
const roles = computed(() => (schema.value?.credit_roles ?? []).filter(role => !ALBUM_ONLY_ROLES.includes(role.key)))
const matches = (role: CreditRoleDefinition) => {
  const term = foldRoleWord(query.value)
  return !term || [role.key, ...Object.values(role.names ?? {}), ...(role.aliases ?? [])].some(name => foldRoleWord(String(name ?? '')).includes(term))
}
const groups = computed(() => {
  const byCategory = new Map<string, CreditRoleDefinition[]>()
  for (const role of roles.value.filter(matches)) byCategory.set(role.category, [...(byCategory.get(role.category) ?? []), role])
  return [...byCategory].map(([category, list]) => ({ category, label: enumLabel('credit_role_category', category), roles: list }))
})
const label = computed(() => model.value.map(roleName).join(separator.value))

const has = (key: string) => model.value.includes(key)
const toggle = (key: string) => {
  if (has(key)) {
    if (model.value.length > 1) model.value = model.value.filter(role => role !== key)
  }
  else model.value = [...model.value, key]
}
</script>

<template>
  <UiPopover placement="bottom-start" :label="t('editor.credits.roles_label')" class="w-72 p-2!" @update:open="query = ''">
    <template #trigger="{ toggle: show, attrs }">
      <button
        type="button"
        v-bind="attrs"
        class="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border bg-field px-2 text-xs font-semibold text-title transition-colors hover:border-faint"
        :class="invalid ? 'border-danger/60' : 'border-field-line'"
        @click="show"
      >
        <span class="truncate">{{ label || t('editor.credits.pick_role') }}</span>
        <Icon name="lucide:chevron-down" class="size-3 shrink-0 text-meta" />
      </button>
    </template>

    <input v-model="query" class="input input-sm mb-2 w-full" :placeholder="t('editor.credits.role_search')" :aria-label="t('editor.credits.role_search')">
    <p v-if="!query" class="mb-2 flex flex-wrap gap-1 border-b border-line pb-2">
      <button
        v-for="key in COMMON_ROLES"
        :key="key"
        type="button"
        class="chip chip-sm"
        :class="{ 'chip-selected': has(key) }"
        :aria-pressed="has(key)"
        @click="toggle(key)"
      >{{ roleName(key) }}</button>
    </p>
    <div class="max-h-64 space-y-2 overflow-y-auto overscroll-contain">
      <div v-for="group in groups" :key="group.category">
        <p class="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-meta">{{ group.label }}</p>
        <label v-for="role in group.roles" :key="role.key" class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-ghost-hover">
          <input type="checkbox" class="checkbox checkbox-xs" :checked="has(role.key)" :disabled="has(role.key) && model.length === 1" @change="toggle(role.key)">
          <span class="min-w-0 flex-1 truncate text-title">{{ roleName(role.key) }}</span>
          <span v-if="roleNameEn(role.key)" class="shrink-0 text-[10px] text-meta">{{ roleNameEn(role.key) }}</span>
        </label>
      </div>
      <p v-if="!groups.length" class="px-2 py-1.5 text-xs text-meta">{{ t('catalog.form.no_results') }}</p>
    </div>
  </UiPopover>
</template>
