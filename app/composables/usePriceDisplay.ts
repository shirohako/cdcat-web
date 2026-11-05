import type { PriceKind, ProductPrice } from '~/types/document'

/** Which price a reader looks for first; the album page shows prices in this order. */
const KIND_ORDER: PriceKind[] = ['list', 'shop', 'event', 'other']
const kindRank = (kind: PriceKind) => {
  const rank = KIND_ORDER.indexOf(kind)
  return rank === -1 ? KIND_ORDER.length : rank
}

/**
 * How an edition's prices read: the kind with its note (会场价 · C107), the amount with its currency code and symbol
 * (JPY ¥4,000, in every interface language, as the code tells ¥ and $ apart) and whether tax is included. One line per price: `会场价 · C107 JPY ¥4,000 含税`; a price whose tax is not stated says nothing about it.
 */
export const usePriceDisplay = () => {
  const { t } = useI18n()

  const amount = (price: Pick<ProductPrice, 'amount' | 'currency'>) => {
    const value = Number.parseFloat(price.amount)
    if (Number.isNaN(value)) return `${price.currency} ${price.amount}`.trim()
    try {
      // Whole amounts drop the decimals; others keep the currency's own (USD $19.90). Without a symbol of its own a
      // currency comes out as its code (CHF 198), which then needs no second one.
      const fraction = Number.isInteger(value) ? { minimumFractionDigits: 0 } : {}
      const text = new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, currencyDisplay: 'narrowSymbol', ...fraction }).format(value)
      return text.startsWith(price.currency) ? text : `${price.currency} ${text}`
    } catch {
      return `${price.currency} ${price.amount}`
    }
  }
  /** By kind; prices of one kind keep the order they were entered in. */
  const sorted = (prices: ProductPrice[]) => [...prices].sort((a, b) => kindRank(a.kind) - kindRank(b.kind))
  const kindLabel = (kind: string) => t(`catalog.price_kind.${kind}`)
  const label = (price: Pick<ProductPrice, 'kind' | 'note'>) => [kindLabel(price.kind), price.note].filter(Boolean).join(' · ')
  const taxLabel = (tax: boolean | null) => t(`catalog.price_tax.${tax === true ? 'included' : tax === false ? 'excluded' : 'unknown'}`)
  const line = (price: ProductPrice) => [label(price), amount(price), price.tax_included === null ? '' : taxLabel(price.tax_included)].filter(Boolean).join(' ')

  return { amount, kindOrder: KIND_ORDER, kindLabel, label, taxLabel, line, sorted }
}
