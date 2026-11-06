import type { Album, AlbumProduct } from '~/types/album'
import type { AlbumExportFormat, AlbumExportHelpers, AlbumExportSource } from '~/utils/albumExport'
import { DATA_LICENSE } from '~/legal/constants'
import { ALBUM_EXPORT_FILES, albumCsv, albumExportFilename, albumJson, albumMarkdown } from '~/utils/albumExport'

/** Saves the album page's data as a file, labelled in the UI language; see utils/albumExport. */
export const useAlbumExport = () => {
  const { t, locale } = useI18n()
  const { showToast } = useToast()
  const display = useCatalogDisplay()
  const { roleName, roleCategory, roleOrder, attributeName } = useCatalogSchema()
  const prices = usePriceDisplay()
  const { separator, aside } = useListPunctuation()
  const absolute = useSiteUrl()

  const helpers = (): AlbumExportHelpers => ({
    titleIn: display.titleIn,
    localeName: display.localeName,
    enumLabel: display.enumLabel,
    formatDuration: display.formatDuration,
    formatDate: display.formatDate,
    attribute: attribute => ({ label: attributeName(attribute.key), value: display.attributeText(attribute) }),
    roleName,
    roleCategory,
    roleOrder,
    uiLocale: locale.value,
    label: (key, params = {}) => t(`album.export.${key}`, params),
    discLabel: position => t('catalog.toc.disc_n', { n: position }),
    productName: (product: AlbumProduct) => product.name || t(`content_display.${product.edition_type}`),
    priceLines: list => prices.sorted(list).map(prices.line),
    separator: separator.value,
    aside,
  })

  const content = (album: Album, format: AlbumExportFormat) => {
    const source: AlbumExportSource = { url: absolute(`/albums/${album.id}`), license: DATA_LICENSE }
    if (format === 'csv') return albumCsv(album, source, helpers())
    if (format === 'markdown') return albumMarkdown(album, source, helpers())
    return albumJson(album, source, new Date())
  }

  const exportAlbum = (album: Album, format: AlbumExportFormat) => {
    try {
      const url = URL.createObjectURL(new Blob([content(album, format)], { type: ALBUM_EXPORT_FILES[format].type }))
      const link = document.createElement('a')
      link.href = url
      link.download = albumExportFilename(album, format)
      document.body.append(link)
      link.click()
      link.remove()
      // Some browsers start the download after click() returns, so the address has to outlive it.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
    catch {
      showToast(t('album.export.failed'), 'error')
    }
  }

  return { exportAlbum }
}
