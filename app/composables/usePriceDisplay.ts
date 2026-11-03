import type { ProductPrice } from '~/types/document'

/**
 * How an edition's prices read: the kind with its note (会场价 · C107), the amount in the price's currency (¥4,000)
 * and whether tax is included. One line per price: `会场价 · C107 ¥4,000 含税`; a price whose tax is not stated says nothing about it.
 */
export const usePriceDisplay = () => {
  const { t } = useI18n()
  const { intlLocale } = useLocaleFormatting()

  const amount = (price: Pick<ProductPrice, 'amount' | 'currency'>) => {
    const value = Number.parseFloat(price.amount)
    if (Number.isNaN(value)) return `${price.currency} ${price.amount}`.trim()
    try {
      return new Intl.NumberFormat(intlLocale.value, { style: 'currency', currency: price.currency, minimumFractionDigits: 0 }).format(value)
    } catch {
      return `${price.currency} ${price.amount}`
    }
  }
  const kindLabel = (kind: string) => t(`catalog.price_kind.${kind}`)
  const label = (price: Pick<ProductPrice, 'kind' | 'note'>) => [kindLabel(price.kind), price.note].filter(Boolean).join(' · ')
  const taxLabel = (tax: boolean | null) => t(`catalog.price_tax.${tax === true ? 'included' : tax === false ? 'excluded' : 'unknown'}`)
  const line = (price: ProductPrice) => [label(price), amount(price), price.tax_included === null ? '' : taxLabel(price.tax_included)].filter(Boolean).join(' ')

  return { amount, kindLabel, label, taxLabel, line }
}
