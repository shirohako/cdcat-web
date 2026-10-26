<template>
  <UiSelect v-model="model" :options="options" size="sm" :invalid="invalid" :title="invalid ? $t('editor.credits.role_level') : undefined" />
</template>

<script setup lang="ts">
import type { CreditRoleDefinition } from '~/types/catalog'
import type { UiSelectOption } from '~/components/ui/Select.vue'

/** A credit role from the dictionary, limited to roles allowed at this level (album or track). */
const props = defineProps<{ level: 'album' | 'track' }>()
const model = defineModel<string>({ required: true })

const { schema, roleName, roleNameEn } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const allowed = (role: CreditRoleDefinition) => props.level === 'album' ? role.is_album_role : role.is_track_role
const roles = computed(() => (schema.value?.credit_roles ?? []).filter(allowed))
const invalid = computed(() => !!model.value && !roles.value.some(role => role.key === model.value))
const groups = computed(() => {
  const byCategory = new Map<string, CreditRoleDefinition[]>()
  for (const role of roles.value) byCategory.set(role.category, [...(byCategory.get(role.category) ?? []), role])
  return [...byCategory].map(([category, list]) => ({ category, roles: list }))
})
const options = computed<UiSelectOption<string>[]>(() => [
  ...(invalid.value ? [{ value: model.value, label: `${roleName(model.value)} ⚠` }] : []),
  ...groups.value.flatMap(group => group.roles.map(role => ({
    value: role.key,
    label: roleName(role.key),
    hint: roleNameEn(role.key) || undefined,
    keywords: role.names?.en,
    group: enumLabel('credit_role_category', group.category),
  }))),
])
</script>
