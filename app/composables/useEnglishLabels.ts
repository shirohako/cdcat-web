/**
 * Whether the English messages have been loaded in this browser. Shared, so every label waiting for
 * them re-renders; only ever set in the browser, so it is never shared between server requests.
 */
const englishLoaded = ref(false)

/**
 * English names shown next to the UI language's ones, e.g. 游戏 Game. Only the UI language's
 * messages are loaded up front, so the English ones are fetched when a component using this mounts.
 * vue-i18n does not re-render when a locale's messages arrive after a lookup found none, so the
 * labels wait for `englishLoaded` instead.
 */
export function useEnglishLabels() {
  const { locale } = useI18n()
  const { $i18n } = useNuxtApp()
  const { enumLabelEn } = useCatalogDisplay()

  const load = async () => {
    if (locale.value === 'en' || englishLoaded.value) return
    await $i18n.loadLocaleMessages('en')
    englishLoaded.value = true
  }
  onMounted(load)
  watch(locale, load)

  /** The English label of an enum value; empty in the English UI and until the messages are loaded. */
  const labelEn = (group: string, value: string | null | undefined) =>
    locale.value === 'en' || !englishLoaded.value ? '' : enumLabelEn(group, value)

  return { labelEn }
}
