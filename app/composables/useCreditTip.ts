/**
 * The tooltip of a credited name in the tracklist and the 参与创作的人 card, where names are cut to one line: a name with
 * no artist page (仅署名) as it is; a printed name other than the linked artist's own both, "关联艺术家：… #id" over
 * "署名：…". An artist credited under their own name gets none (''): their link and hover card say it all.
 */
export const useCreditTip = () => {
  const { t } = useI18n()
  return (name: string, artistId: number | null, artistName?: string | null): string => {
    if (artistId === null) return name
    if (!artistName || name === artistName) return ''
    return `${t('catalog.credit_tip.artist', { name: `${artistName} #${artistId}` })}\n${t('catalog.credit_tip.credited', { name })}`
  }
}
