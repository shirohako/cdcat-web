export default defineNuxtPlugin(() => {
  const { $i18n } = useNuxtApp()
  const route = useRoute()

  // 语言代码映射
  const langMap: Record<string, string> = {
    'schinese': 'zh-Hans',
    'tchinese': 'zh-Hant',
    'english': 'en',
    'japanese': 'ja'
  }

  // 检查 URL 查询参数
  const langParam = route.query.lang || route.query.l

  if (langParam && typeof langParam === 'string') {
    const langStr = langParam.toLowerCase()
    const targetLocale = langMap[langStr] || langParam

    // 检查目标语言是否有效
    const validLocale = $i18n.locales.value.find((loc: any) => loc.code === targetLocale)

    if (validLocale && $i18n.locale.value !== targetLocale) {
      $i18n.setLocale(targetLocale as 'zh-Hans' | 'zh-Hant' | 'en' | 'ja')
    }
  }
})
