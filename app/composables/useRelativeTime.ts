/** "3 minutes ago" in the current language, falling back to a date after a week. */
export const useRelativeTime = () => {
  const { locale } = useI18n()
  const { formatDate } = useLocaleFormatting()

  const ago = (value: string | null | undefined) => {
    if (!value) return ''
    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
    const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
    if (seconds < 45) return format.format(0, 'second')
    if (seconds < 3600) return format.format(-Math.round(seconds / 60), 'minute')
    if (seconds < 86400) return format.format(-Math.round(seconds / 3600), 'hour')
    if (seconds < 86400 * 7) return format.format(-Math.round(seconds / 86400), 'day')
    return formatDate(value)
  }

  const exact = (value: string | null | undefined) => value ? formatDate(value, { dateStyle: 'medium', timeStyle: 'short' }) : ''

  return { ago, exact }
}
