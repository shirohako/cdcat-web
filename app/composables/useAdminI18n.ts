import messages from '~~/i18n/locales/zh-Hans.json'

// Keep the main site's language preference unchanged while the admin UI is Chinese.
export const useAdminI18n = () => useI18n<{ message: typeof messages }, 'zh-Hans'>({
  useScope: 'local',
  inheritLocale: false,
  locale: 'zh-Hans',
  messages: { 'zh-Hans': messages },
})
