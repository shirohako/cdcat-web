import type { AttributeDefinition, CatalogSchema, CreditRoleDefinition } from '~/types/catalog'

/**
 * The catalog's dictionaries from GET /catalog/schema: credit roles, attribute definitions, enums
 * and link providers. Loaded once and shared by every component on the page.
 */
export const useCatalogSchema = () => {
  const { $api } = useNuxtApp()
  const { locale, t } = useI18n()
  const { localizedContent } = useLocaleFormatting()
  const request = useAsyncData('catalog:schema', () => $api<CatalogSchema>('/v1/catalog/schema'), {
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })
  const { data: schema, pending } = request
  /** Resolves once the dictionaries are in: for code that needs role names before the page renders (the album's Markdown). */
  const ready = async () => { await request }

  const roles = computed(() => new Map<string, CreditRoleDefinition>((schema.value?.credit_roles ?? []).map(role => [role.key, role])))
  const attributes = computed(() => new Map<string, AttributeDefinition>((schema.value?.attribute_definitions ?? []).map(definition => [definition.key, definition])))

  /** The role's name in the UI language; unknown or retired roles show their key. */
  const roleName = (key: string) => localizedContent(roles.value.get(key)?.names, key.replaceAll('_', ' '))
  /** The role's English name, for showing next to the UI language's one; empty in the English UI or when they read the same. */
  const roleNameEn = (key: string) => {
    const english = roles.value.get(key)?.names?.en
    return locale.value === 'en' || !english || english === roleName(key) ? '' : english
  }
  /**
   * The tooltip of a tag showing a printed job title, two lines: the job title, and the role it is filed under with
   * its English name in brackets outside the English UI. Empty without a job title (the tag shows the role's name).
   * The tooltip shows it as two lines with `whitespace-pre-line`.
   */
  const roleTip = (key: string, label: string | null | undefined) => {
    if (!label) return ''
    const english = roleNameEn(key)
    return `${t('catalog.role_tip.title', { label })}\n${t('catalog.role_tip.role', { role: english ? `${roleName(key)} (${english})` : roleName(key) })}`
  }
  const roleCategory = (key: string) => roles.value.get(key)?.category ?? 'other'
  /** Position of the role in the dictionary, for sorting credits the way the admin ordered them. */
  const roleOrder = (key: string) => {
    const index = schema.value?.credit_roles.findIndex(role => role.key === key) ?? -1
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }

  const attributeName = (key: string) => localizedContent(attributes.value.get(key)?.names, key.replaceAll('_', ' '))
  /** The attribute's English name, for showing next to the UI language's one; empty in the English UI or when they read the same. */
  const attributeNameEn = (key: string) => {
    const english = attributes.value.get(key)?.names?.en
    return locale.value === 'en' || !english || english === attributeName(key) ? '' : english
  }
  const attributeDefinition = (key: string) => attributes.value.get(key) ?? null

  return { schema, pending, ready, roleName, roleNameEn, roleTip, roleCategory, roleOrder, attributeName, attributeNameEn, attributeDefinition }
}
