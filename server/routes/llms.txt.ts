import { DATA_LICENSE } from '../../app/legal/constants'
import { SITE_LOCALES } from '../../shared/utils/languageUrls'

/**
 * /llms.txt (llmstxt.org): what the site is and how to read it, for language models and the tools that browse on
 * their behalf. Markdown, in English, short enough to read in one go; the facts it gives are the ones a model
 * can't work out from a single page.
 */
export default defineEventHandler((event) => {
  const { baseUrl, apiBaseUrl } = useRuntimeConfig(event).public
  const at = (path: string) => siteUrl(String(baseUrl ?? ''), path)
  const api = `${String(apiBaseUrl ?? '').replace(/\/+$/, '')}/v1`
  const languages = SITE_LOCALES.map(locale => `\`?lang=${locale}\``).join(', ')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `# CDCat

> CDCat is a community-edited database of Japanese music releases: doujin (self-published) music, VOCALOID, and anime and game music. Each album has its editions, discs, full track list, per-track credits, cover art and links; artists, circles and labels, the works the music was made for, and events such as M3 have pages of their own.

## Reading an album

- An album's page is \`${at('/albums/{id}')}\`.
- Add \`.md\` for the whole album as Markdown: \`${at('/albums/{id}.md')}\`. It holds everything the page shows: names in other languages, catalog number, release date, editions and prices, the track list with every credit, bonuses, related works and links. Requesting the page with \`Accept: text/markdown\` returns the same text.
- The interface language follows the request; ${languages} picks one, on pages and on \`.md\` addresses alike. Titles of albums, tracks and artists are in their original language (mostly Japanese), with translated and romanized names listed beside them where editors have added them.

## Sections

- [Albums](${at('/albums')}): every release, newest additions first
- [Artists](${at('/artists')}): people, groups, doujin circles, labels and publishers
- [Works](${at('/entries')}): games, anime and other works that albums belong to
- [Events](${at('/events')}): doujin events with their dates, venues and releases
- [Articles](${at('/articles')}) and [Discussions](${at('/discussions')}): writing by members
- Track pages are \`${at('/tracks/{id}')}\`; tracks with lyrics show them there, with translations where they exist.

## Data

- [API reference](${at('/docs/api')}): a public, read-only JSON API at \`${api}\`. No key or sign-up; rate limits are in the reference.
- [Sitemap](${at('/sitemap.xml')}): the pages worth reading, grouped by type and language.
- The catalog data may be reused under [${DATA_LICENSE.name}](${DATA_LICENSE.url}): credit CDCat and link the page the data came from. Cover art, lyrics and members' writing belong to their owners. See the [terms](${at('/terms')}).

## About

- [About CDCat](${at('/about')})
- [Editing guide](${at('/docs/design')}): how the catalog is organised (in Chinese)
`
})
