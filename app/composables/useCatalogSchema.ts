import type { AttributeDefinition, CatalogSchema, CreditRoleDefinition } from '~/types/catalog'

/**
 * The catalog's dictionaries from GET /catalog/schema: credit roles, attribute definitions, enums
 * and link providers. Loaded once and shared by every component on the page.
 */
export const useCatalogSchema = () => {
  const { $api } = useNuxtApp()
  const { localizedContent } = useLocaleFormatting()
  const { data: schema, pending } = useAsyncData('catalog:schema', () => $api<CatalogSchema>('/v1/catalog/schema'), {
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })

  const roles = computed(() => new Map<string, CreditRoleDefinition>((schema.value?.credit_roles ?? []).map(role => [role.key, role])))
  const attributes = computed(() => new Map<string, AttributeDefinition>((schema.value?.attribute_definitions ?? []).map(definition => [definition.key, definition])))

  /** The role's name in the UI language; unknown or retired roles show their key. */
  const roleName = (key: string) => localizedContent(roles.value.get(key)?.names, key.replaceAll('_', ' '))
  const roleCategory = (key: string) => roles.value.get(key)?.category ?? 'other'
  /** Position of the role in the dictionary, for sorting credits the way the admin ordered them. */
  const roleOrder = (key: string) => {
    const index = schema.value?.credit_roles.findIndex(role => role.key === key) ?? -1
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }

  const attributeName = (key: string) => localizedContent(attributes.value.get(key)?.names, key.replaceAll('_', ' '))
  const attributeDefinition = (key: string) => attributes.value.get(key) ?? null

  return { schema, pending, roleName, roleCategory, roleOrder, attributeName, attributeDefinition }
}
