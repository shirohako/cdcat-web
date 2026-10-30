import type { ArticleLicense } from '~/types/article'

/** Whether a license lets readers do something: yes, no, or yes when they share under the same license. */
export type LicensePermission = 'yes' | 'no' | 'share_alike'

export interface LicenseInfo {
  key: ArticleLicense
  /** The short name shown on badges, e.g. "CC BY-NC-SA 4.0". */
  short: string
  reprint: LicensePermission
  commercial: LicensePermission
  derivatives: LicensePermission
  /** The Creative Commons deed without a language suffix; null for all rights reserved. */
  url: string | null
}

/** The licenses an author can choose, in the order the picker lists them (docs/articles/README.md#协议与转载). */
export const ARTICLE_LICENSES: LicenseInfo[] = [
  { key: 'cc_by_nc_sa', short: 'CC BY-NC-SA 4.0', reprint: 'yes', commercial: 'no', derivatives: 'share_alike', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
  { key: 'cc_by_nc', short: 'CC BY-NC 4.0', reprint: 'yes', commercial: 'no', derivatives: 'yes', url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
  { key: 'cc_by_nc_nd', short: 'CC BY-NC-ND 4.0', reprint: 'yes', commercial: 'no', derivatives: 'no', url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/' },
  { key: 'cc_by_sa', short: 'CC BY-SA 4.0', reprint: 'yes', commercial: 'yes', derivatives: 'share_alike', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  { key: 'cc_by', short: 'CC BY 4.0', reprint: 'yes', commercial: 'yes', derivatives: 'yes', url: 'https://creativecommons.org/licenses/by/4.0/' },
  { key: 'cc_by_nd', short: 'CC BY-ND 4.0', reprint: 'yes', commercial: 'yes', derivatives: 'no', url: 'https://creativecommons.org/licenses/by-nd/4.0/' },
  { key: 'cc0', short: 'CC0 1.0', reprint: 'yes', commercial: 'yes', derivatives: 'yes', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { key: 'all_rights_reserved', short: '©', reprint: 'no', commercial: 'no', derivatives: 'no', url: null },
]

export const DEFAULT_ARTICLE_LICENSE: ArticleLicense = 'cc_by_nc_sa'

export const articleLicense = (key: ArticleLicense | null | undefined): LicenseInfo | null => ARTICLE_LICENSES.find(item => item.key === key) ?? null

/** The deed in the site language, where Creative Commons has one. */
export const licenseDeedUrl = (info: LicenseInfo, locale: string): string | null => {
  if (!info.url) return null
  const deed = ({ 'zh-Hans': 'zh-hans', 'zh-Hant': 'zh-hant', 'ja': 'ja', 'en': 'en', 'ko': 'ko' } as Record<string, string>)[locale]
  return deed ? `${info.url}deed.${deed}` : info.url
}
