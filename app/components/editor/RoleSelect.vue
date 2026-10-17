<template>
  <select v-model="model" class="select select-sm" :class="{ 'select-error': invalid }" :title="invalid ? $t('editor.credits.role_level') : undefined">
    <option v-if="invalid" :value="model">{{ roleName(model) }} ⚠</option>
    <optgroup v-for="group in groups" :key="group.category" :label="enumLabel('credit_role_category', group.category)">
      <option v-for="role in group.roles" :key="role.key" :value="role.key">{{ roleName(role.key) }}</option>
    </optgroup>
  </select>
</template>

<script setup lang="ts">
import type { CreditRoleDefinition } from '~/types/catalog'

/** A credit role from the dictionary, limited to roles allowed at this level (album, track or work). */
const props = defineProps<{ level: 'album' | 'track' | 'work' }>()
const model = defineModel<string>({ required: true })

const { schema, roleName } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const allowed = (role: CreditRoleDefinition) => props.level === 'album' ? role.is_album_role : props.level === 'track' ? role.is_track_role : role.is_work_role
const roles = computed(() => (schema.value?.credit_roles ?? []).filter(allowed))
const invalid = computed(() => !!model.value && !roles.value.some(role => role.key === model.value))
const groups = computed(() => {
  const byCategory = new Map<string, CreditRoleDefinition[]>()
  for (const role of roles.value) byCategory.set(role.category, [...(byCategory.get(role.category) ?? []), role])
  return [...byCategory].map(([category, list]) => ({ category, roles: list }))
})
</script>
