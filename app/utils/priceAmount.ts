/**
 * An amount as typed, in plain half-width digits: `６，０００` and `6,000` are 6000. Only commas in thousands places go,
 * so `19,90` stays as it is and the server turns it down rather than saving 1990.
 * App\Services\Catalog\Document\Normalizer does the same.
 */
export const plainAmount = (amount: unknown) => {
  const text = String(amount ?? '').normalize('NFKC').trim()
  return /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text) ? text.replaceAll(',', '') : text
}
