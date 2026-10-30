/** Punctuation the code adds between items, in the UI language: full-width in Chinese and Japanese, ASCII elsewhere. */
export const useListPunctuation = () => {
  const { locale } = useI18n()
  const wide = computed(() => /^(zh|ja)/.test(locale.value))
  return {
    /** Between the items of a short list: 、 or ", ". */
    separator: computed(() => wide.value ? '、' : ', '),
    /** Between items that may hold commas themselves: ； or "; ". */
    clauseSeparator: computed(() => wide.value ? '；' : '; '),
    /** A note in brackets after a name: （…） or " (…)". */
    aside: (text: string) => wide.value ? `（${text}）` : ` (${text})`,
  }
}
