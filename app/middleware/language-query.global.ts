import { queryLanguage } from '~/utils/languageQuery'

/**
 * `?l=` (as on Steam) or `?lang=` switches the interface language on any page, on the first load and on
 * navigations within the site alike. It is remembered like a choice made in the language menu.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const wanted = queryLanguage(to.query)
  const { $i18n } = useNuxtApp()
  if (wanted && $i18n.locale.value !== wanted) await $i18n.setLocale(wanted)
})
