<script setup lang="ts">
import type { CreditRoleDefinition } from '~/types/catalog'
import { ALBUM_ONLY_ROLES, COMMON_ROLES } from '~/utils/creditLines'
import { foldRoleWord } from '~/utils/creditParser'

/**
 * The roles of a credit line, as a select-like button ("作曲、编曲") that opens a list to tick them in: the common
 * ones first, then the whole dictionary by group, searchable by every language's name and the other spellings. With
 * `required` (a line that has people) one role at least stays ticked, and the list says why; a line with no one yet
 * can be emptied to pick again. `starting` (a row being started) opens the list at once while no role is picked, and
 * the first pick closes it, so the search for a person comes next. Roles only the whole album has (发行、厂牌 …) belong in the byline block and are not
 * offered, nor those in `exclude`. `single` picks one role instead, replacing the one there and closing the list; the
 * `trigger` slot replaces the button.
 */
const model = defineModel<string[]>({ required: true })
const props = defineProps<{ invalid?: boolean, single?: boolean, exclude?: string[], required?: boolean, starting?: boolean }>()

const { t } = useI18n()
const { separator } = useListPunctuation()
const { schema, roleName, roleNameEn } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const query = ref('')
const offered = (key: string) => !ALBUM_ONLY_ROLES.includes(key) && !props.exclude?.includes(key)
const roles = computed(() => (schema.value?.credit_roles ?? []).filter(role => offered(role.key)))
const common = computed(() => COMMON_ROLES.filter(offered))
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
/** Unticking this one would leave a line of people with no role. */
const locked = (key: string) => !!props.required && has(key) && model.value.length === 1
const toggle = (key: string, close: (returnFocus?: boolean) => void) => {
  if (locked(key)) return
  const first = props.starting && !model.value.length
  model.value = has(key) ? model.value.filter(role => role !== key) : [...model.value, key]
  if (first) close(false)
}
const pick = (key: string, close: (returnFocus?: boolean) => void) => {
  if (props.single) {
    if (!has(key)) model.value = [key]
    close()
  }
  else toggle(key, close)
}

const popover = useTemplateRef('popover')
onMounted(() => {
  if (props.starting && !model.value.length) popover.value?.toggle()
})
</script>

<template>
  <UiPopover ref="popover" placement="bottom-start" :label="t('editor.credits.roles_label')" class="w-72 p-2!" @update:open="query = ''">
    <template #trigger="{ toggle: show, attrs }">
      <slot name="trigger" :toggle="show" :attrs="attrs">
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
      </slot>
    </template>

    <template #default="{ close }">
      <input v-model="query" class="input input-sm mb-2 w-full" :placeholder="t('editor.credits.role_search')" :aria-label="t('editor.credits.role_search')">
      <p v-if="!query" class="mb-2 flex flex-wrap gap-1 border-b border-line pb-2">
        <button
          v-for="key in common"
          :key="key"
          type="button"
          class="chip chip-sm"
          :class="{ 'chip-selected': has(key) }"
          :aria-pressed="has(key)"
          @click="pick(key, close)"
        >{{ roleName(key) }}</button>
      </p>
      <div class="max-h-64 space-y-2 overflow-y-auto overscroll-contain">
        <div v-for="group in groups" :key="group.category">
          <p class="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-meta">{{ group.label }}</p>
          <template v-if="single">
            <button
              v-for="role in group.roles"
              :key="role.key"
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-ghost-hover"
              :aria-pressed="has(role.key)"
              @click="pick(role.key, close)"
            >
              <Icon name="lucide:check" class="size-3.5 shrink-0 text-primary" :class="{ invisible: !has(role.key) }" />
              <span class="min-w-0 flex-1 truncate text-title">{{ roleName(role.key) }}</span>
              <span v-if="roleNameEn(role.key)" class="shrink-0 text-[10px] text-meta">{{ roleNameEn(role.key) }}</span>
            </button>
          </template>
          <label v-for="role in group.roles" v-else :key="role.key" class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-ghost-hover">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="has(role.key)" :disabled="locked(role.key)" @change="toggle(role.key, close)">
            <span class="min-w-0 flex-1 truncate text-title">{{ roleName(role.key) }}</span>
            <span v-if="roleNameEn(role.key)" class="shrink-0 text-[10px] text-meta">{{ roleNameEn(role.key) }}</span>
          </label>
        </div>
        <p v-if="!groups.length" class="px-2 py-1.5 text-xs text-meta">{{ t('catalog.form.no_results') }}</p>
      </div>
      <p v-if="required && !single && model.length === 1" class="mt-2 border-t border-line px-2 pt-2 text-[11px] leading-4 text-meta">{{ t('editor.credits.role_keep_one') }}</p>
    </template>
  </UiPopover>
</template>
