import { md } from '~/documents/sections'
import type { ApiDocsTexts } from '../types'

const texts: ApiDocsTexts = {
  title: 'Public API',
  intro: 'Read the albums, artists, events, entries and franchises on CDCat over HTTP. No sign-up and no key needed; the catalog data is shared under CC BY-SA 4.0.',

  labels: {
    tag: 'Developer docs',
    beta: 'Beta',
    beta_note: 'Fields may change before the stable release; the latest version of these docs is what counts',
    base_url: 'Base URL',
    copy: 'Copy',
    copied: 'Copied',
    copy_url: 'Copy request URL',
    copy_json: 'Copy JSON',
    copy_failed: 'Could not copy. Select the text and copy it by hand',
    in_section: 'Endpoints and objects in this section',
    path_params: 'Path parameters',
    query_params: 'Query parameters',
    response: 'Response data',
    response_model: 'data is a {model}.',
    extends: 'Has every field of {model}, plus:',
    statuses: 'Status codes',
    example: 'Example',
    default: 'Default {value}',
    required: 'Required',
    optional: 'Not always present',
    see: 'Values in {name}',
    more_items: '{n} more',
    more_model: 'Fields in {model}',
    model: 'Object',
    enum: 'Values',
    feedback_title: 'Feedback',
    feedback_text: 'If the docs don\'t match the API, you want a new endpoint, or you run into a problem, let us know.',
    feedback_issue: 'Open an issue on GitHub',
    feedback_email: 'Email us',
  },

  common: {
    params: {
      page: 'Page number, starting at 1.',
      per_page: 'Items per page. Out of range returns 422.',
      include_pending: 'Also list pending content (live, waiting for review).',
      direction: 'Sort direction: `asc` ascending, `desc` descending.',
    },
    fields: {
      pagination: 'Pagination info, see [Pagination](#object-pagination).',
      slug: 'URL slug, for display only; it can\'t be used for lookups.',
      release_date_precision: 'How precise the date is. When only the year or month is known, the date is set to the 1st of that year or month; display it at that precision.',
      is_favorited: 'Whether the current user has favorited it. Only meaningful when signed in on the site; always `false` for other requests.',
      is_pending: 'Whether it is pending: live since it was submitted, and waiting for review.',
      titles: 'Names other than the original: official names, translations, readings, aliases and so on, see [Title](#object-title).',
      links: 'External links, already in order, see [Link](#object-link).',
      share_card_url: 'URL of the share card (a 1200×630 JPEG); `null` until it has been generated.',
      version: 'Current version number, increased by one on every edit.',
      pending_revision: 'The submission waiting for review. Only the submitter and reviewers can see it; it is always `null` for everyone else.',
      created_at: 'When it was created (UTC).',
      updated_at: 'When it was last updated (UTC). Changes to stats such as the view count also update it.',
    },
  },

  sections: {
    'overview': {
      title: 'Overview',
      lead: 'The public API lets other sites and apps read CDCat\'s music data. It is read-only and needs no sign-up or key.',
    },
    'usage': {
      title: 'Usage rules',
      lead: 'You can reuse the data freely, as long as you give credit and follow the license. Please also keep your request rate low so you don\'t burden the server.',
    },
    'conventions': {
      title: 'Conventions',
      lead: 'Rules every endpoint follows: the response format, pagination, how to write parameters, names and dates, and pending and merged content.',
    },
    'rate-limits': {
      title: 'Rate limits',
      lead: 'The read endpoints that need no sign-in share one rate limit; search has a limit of its own.',
    },
    'errors': {
      title: 'Errors',
      lead: 'When something goes wrong, the HTTP status code tells you what kind of problem it is. `error.name` is a stable error name; use it to tell errors apart.',
    },
    'albums': {
      title: 'Albums and tracks',
      short: 'Albums and tracks',
      lead: 'An album is the release that holds the tracks. Limited and regular editions are different editions (Product) of the same album; a release with a different tracklist, such as a vinyl, gets an album of its own. Lists return the compact AlbumSimple; the detail adds discs, tracks, credits, editions and images.',
    },
    'lyrics': {
      title: 'Lyrics',
      lead: 'Lyrics belong to tracks: each track has at most one original, plus any number of translations and transliterations. Lyrics belong to their rights holders, aren\'t covered by CC BY-SA, and may only be used for reference and identification.',
    },
    'artists': {
      title: 'Artists',
      lead: 'Artists include people, groups, doujin circles, companies, virtual singers and characters. Record companies, labels and publishers are artists too (type `company`); there are no separate labels.',
    },
    'events': {
      title: 'Events',
      lead: 'Each event series (such as M3 or Comic Market) holds its individual events. Venue maps and booths come from the organizers\' public data and are kept as they are.',
    },
    'entries': {
      title: 'Entries',
      lead: 'An entry is a source work an album is tied to, such as an anime, game, film or book. Albums join franchises through entries.',
    },
    'franchises': {
      title: 'Franchises',
      lead: 'A franchise groups related entries, at most two levels deep: franchises and child franchises. It is not the same thing as an event series (`/event-series`).',
    },
    'search': {
      title: 'Search',
      lead: 'Search albums, tracks, artists, entries and franchises at once. Simplified Chinese, Traditional Chinese and Japanese kanji, as well as kana and full-width and half-width characters, are normalized before comparing.',
    },
    'dictionaries': {
      title: 'Dictionaries and enums',
      short: 'Dictionaries and enums',
      lead: 'Values in the API are fixed lowercase English. `/catalog/schema` has the complete, up-to-date list; this section explains what each value means.',
    },
    'objects': {
      title: 'Common objects',
      lead: 'Objects that appear in many endpoints.',
    },
    'changes': {
      title: 'Changelog',
      lead: 'Changes that affect API clients, newest first. Until the stable release the API is in beta and fields may change.',
    },
  },

  prose: {
    'overview': md`
      ### Base URL

      Every endpoint lives under this address; the paths on this page leave it out:

      \`\`\`
      {{base}}
      \`\`\`

      Requests use \`GET\` and return JSON. For example, to read an album:

      \`\`\`
      GET {{base}}/albums/1287
      \`\`\`

      ### What these docs cover

      - Albums and tracks, lyrics, artists, events, entries, franchises and search, plus the enums.
      - The API is still in beta: fields may change before the stable release. Changes are not announced separately; the latest version of these docs is what counts.
      - Docs for the endpoints that submit and edit data are not finished yet.

      ### No key needed

      None of these endpoints need a sign-in, and there are no API keys. Web pages on other sites can call them cross-origin directly: CORS allows any origin, and requests carry no cookies.
    `,
    'usage': md`
      ### What the license doesn't cover

      Lyrics, cover art and other images belong to their rights holders and may only be used for reference and identification; CC BY-SA doesn't apply to them. Reviews, discussions and articles belong to their authors, aren't part of the catalog data, and their endpoints aren't covered in these docs.

      ### Request etiquette

      - Keep your request rate low and don't send lots of requests at once. The exact limits are in [Rate limits](#rate-limits).
      - Put your app's name and contact details in \`User-Agent\`, for example \`MyLyricsApp/1.2 (https://example.com; me@example.com)\`, so we can reach you if something goes wrong.
      - Cache what you can; you don't need to request the same data every time.
      - The API domain's robots.txt is there to keep search engines from indexing the API. Calling the API as these docs describe isn't restricted by it.

      For the rest, see [Using the service responsibly](/terms#acceptable-use) in the Terms of Service.

      ### Feedback

      If the docs don't match the API, you want a new endpoint, or you run into a problem, you can [open an issue]({{issues}}) on GitHub or email {{email}}.
    `,
    'conventions': md`
      ### Response format

      On success, \`success\` is \`true\` and the content is in \`data\`; on failure, \`success\` is \`false\` and the reason is in \`error\`, see [Errors](#errors).

      \`\`\`json
      { "success": true, "data": { … } }
      \`\`\`

      ### Pagination

      List endpoints paginate with \`page\` (starting at 1) and \`per_page\`; \`data\` holds the list itself and a [Pagination](#object-pagination). Each endpoint's default page size and maximum are listed with its parameters; going over the maximum returns 422.

      ### Writing parameters

      - Write booleans as \`true\` / \`false\`, or \`1\` / \`0\`.
      - Write arrays as \`names[]=a&names[]=b\`.
      - Sort with \`sort\` (what to sort by) and \`direction\` (\`asc\` ascending, \`desc\` descending). The album list's \`sort\` is a set of fixed orders and has no \`direction\`.
      - An unknown parameter value returns 422; it is never silently replaced with the default. Parameters these docs don't mention are ignored.
      - IDs are always numbers. \`slug\` is for display only and can't be used for lookups.

      ### Names and translations

      The API doesn't return different content per language. \`title\` or \`name\` is the original name, the one printed on the release; other names are in \`titles\`, see [Title](#object-title). To show names in the reader's language, we suggest taking, in order: the \`official\` name in that language, the \`translation\` in that language, then the original name.

      Albums in lists (AlbumSimple) have no \`titles\` and can only show the original name; when you need a translated name, request the album detail. The \`description\` of events and event series is an object split by language, for example \`{ "ja": "…", "en": "…" }\`.

      ### Dates and times

      - Dates are written \`YYYY-MM-DD\`. Release dates come with \`release_date_precision\`: when only the year or month is known, the precision is \`year\` or \`month\` and the date is set to the 1st of that year or month. Leave out the unknown parts when displaying it.
      - Times are ISO 8601 in UTC, without fractional seconds, for example \`2026-10-30T08:00:00Z\`.
      - An event's \`start_time\` and \`end_time\` are local times at the venue, \`HH:MM\`, with no time zone.

      ### Images

      Image addresses are always full URLs. Album images ([Image](#object-image)) give the original \`url\`, a \`thumbnail_url\` at most 300px on the long side, and a \`medium_url\` at most 1200px. Use these addresses as they are; don't build your own. Images of entries, franchises and events may be hosted on other sites.

      ### Pending content

      Albums, artists, entries and franchises that members create go live as soon as they are submitted and wait for review at the same time; while they do, \`is_pending\` is \`true\`. Lists of these four kinds leave them out by default and only include them with \`include_pending=true\`; detail and other endpoints return them as usual. Content that fails review is deleted, and later requests for it get 404.

      ### Adult content

      \`is_adult\` is only a flag; the API doesn't filter for you. If your app is for all ages, filter it yourself.

      ### Merges and deletions

      Duplicate albums, tracks and artists get merged. When you request an ID that was merged away, \`/albums/{id}\`, \`/tracks/{id}\`, \`/artists/{id}\` and \`/artists/{id}/card\` return 301: \`Location\` points to the one that was kept, and \`data.moved_to\` gives its type and new ID.

      \`\`\`json
      { "success": true, "data": { "moved_to": { "resource_type": "album", "id": 1290 } } }
      \`\`\`

      Other endpoints return 404 for merged or deleted IDs.

      ### Caching

      Responses from \`/catalog/schema\`, venue maps and booth lists carry an \`ETag\`. Send it back in \`If-None-Match\` next time; if nothing has changed you get 304 and don't have to download it again.
    `,
    'rate-limits': md`
      | Requests | Limit per minute | Counted by |
      |---|---|---|
      | Without a sign-in token | {{rate_limit}} | IP address; an IPv6 /64 block counts as one |
      | With a valid sign-in token | {{rate_limit_user}} | Account |
      | \`/search\` | A separate {{search_limit}} | Account or IP, counted separately from the above |

      Every response carries two headers: \`X-RateLimit-Limit\` is the limit per minute, and \`X-RateLimit-Remaining\` is how many requests are left this minute. Going over the limit returns 429:

      \`\`\`json
      {
        "success": false,
        "error": {
          "code": 50000,
          "name": "RATE_LIMIT_EXCEEDED",
          "message": "Too Many Attempts.",
          "details": { "retry_after": 42 }
        }
      }
      \`\`\`

      \`details.retry_after\` and the \`Retry-After\` header are both the number of seconds to wait, and \`X-RateLimit-Reset\` is when you can retry (a Unix timestamp). After a 429, wait \`Retry-After\` seconds before trying again; don't retry right away.

      Cross-origin requests can read these headers too. The limits may change later, so go by the response headers rather than hard-coding them.
    `,
    'errors': md`
      The object returned on errors; its fields are in [Error](#object-error):

      \`\`\`json
      {
        "success": false,
        "error": {
          "code": 40000,
          "name": "VALIDATION_FAILED",
          "message": "The given data failed validation",
          "details": { "per_page": ["The per page field must not be greater than 100."] }
        }
      }
      \`\`\`

      \`message\` is in English, for debugging only, and may change. \`details\` only appears for invalid parameters and when the rate limit is exceeded.

      | HTTP | \`error.name\` | When |
      |---|---|---|
      | 404 | \`RESOURCE_NOT_FOUND\` | The address is right, but the content doesn't exist or has been deleted |
      | 404 | \`NOT_FOUND\` | The address is wrong: the path doesn't exist, or the ID isn't a number |
      | 405 | \`METHOD_NOT_ALLOWED\` | A request method other than \`GET\` was used |
      | 422 | \`VALIDATION_FAILED\` | Invalid parameters; \`details\` lists the reasons by parameter name |
      | 429 | \`RATE_LIMIT_EXCEEDED\` | Too many requests, see [Rate limits](#rate-limits) |
      | 500 | \`INTERNAL_ERROR\` | A server error. Try again later, and tell us if it keeps happening |

      Also, merged albums, tracks and artists return 301 (see [Merges and deletions](#merges-and-deletions)), and endpoints with an \`ETag\` may return 304.
    `,
  },

  statuses: {
    'VALIDATION_FAILED': 'Invalid parameters; `details` lists the reasons by parameter name.',
    'RESOURCE_NOT_FOUND': 'The content doesn\'t exist or has been deleted.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests; wait `retry_after` seconds and try again.',
    '301': 'This ID has been merged into another; `Location` and `data.moved_to` give the new ID.',
    '304': 'Sent with `If-None-Match`, and the content hasn\'t changed.',
  },

  endpoints: {
    'get-albums': {
      title: 'List albums',
      summary: 'Filter albums and return them a page at a time. Pending albums are left out of the list by default.',
      params: {
        'type': 'Album type.',
        'category': 'Album category, such as `doujin` or `game`.',
        'format': 'Disc format, such as `cd` or `vinyl`.',
        'artist_id': 'Only list albums this artist worked on, in any role.',
        'release_event_id': 'Only list albums first released at this event.',
        'year': 'Release year.',
        'attributes[key]': 'Filter by attribute, up to 5, for example `attributes[cover_character]=射命丸文`. Write attributes that point to an entry or other content as `entry:12`. Only text, URL, choice and reference attributes can be filtered.',
        'sort': '`new` by release date, newest first; `trending` by popularity over the last 30 days; `top_rated` by rating ranking (updated once a day).',
        'search': 'Search titles, other names, catalog numbers, barcodes and credited names. At least 2 characters without spaces, or 1 if it has kanji or kana; at most 3 words. Without `sort`, results are sorted by relevance.',
      },
      fields: {
        albums: 'The albums on this page.',
      },
      notes: md`
        ::: tip No translated names in lists
        AlbumSimple has no \`titles\` and can only show the original name. To show translated names in the reader's language, request the [album detail](#get-albums-id).
        :::
      `,
    },
    'get-albums-id': {
      title: 'Get an album',
      summary: 'Everything about one album: discs and tracks, credits, editions, bonuses, images, external links, linked entries and stats.',
      params: {
        id: 'Album ID.',
      },
      notes: md`
        - Each request counts as one view (once a day per source), and \`views_count\` updates every 5 minutes.
        - Artists & release roles (publisher, label, artist and so on) are in \`credits\` too, with \`category\` set to \`release\`.
      `,
    },
    'get-tracks-id': {
      title: 'Get a track',
      summary: 'One track, with its album, the tracklist of that album, its originals and the tracks arranged from it.',
      params: {
        id: 'Track ID.',
      },
    },
    'get-tracks-id-lyrics': {
      title: 'List a track\'s lyrics',
      summary: 'All lyrics of a track (original, translations, transliterations), as summaries without the text. Sorted by ID, not paginated.',
      params: {
        id: 'Track ID.',
      },
      fields: {
        lyrics: 'This track\'s lyrics, see [LyricSummary](#object-lyric-summary).',
      },
    },
    'get-lyrics-id': {
      title: 'Get lyrics',
      summary: 'The text and source of one set of lyrics.',
      params: {
        id: 'Lyrics ID.',
      },
      notes: md`
        ::: warning Rights to lyrics
        Lyrics belong to their rights holders, aren't covered by CC BY-SA, and may only be used for reference and identification, see [Usage rules](#usage).
        :::
      `,
    },
    'get-artists': {
      title: 'List artists',
      summary: 'Filter artists and return them a page at a time, newest first. Pending artists are left out of the list by default.',
      params: {
        type: 'Artist type.',
        search: 'Search names, other names and slugs; a partial match is enough. When searching, results are sorted by how well they match.',
        has_albums: 'Only list artists that have albums.',
      },
      fields: {
        artists: 'The artists on this page, without the detail-only fields.',
      },
    },
    'get-artists-id': {
      title: 'Get an artist',
      summary: 'One artist\'s data, with other names, external links, attributes and related artists.',
      params: {
        id: 'Artist ID.',
      },
    },
    'get-artists-id-albums': {
      title: 'List an artist\'s releases',
      summary: 'Albums where this artist has an "Artists & release" role on the whole album (artist, publisher, label, distributor, manufacturer, planning), by release date, newest first. Includes pending albums.',
      params: {
        id: 'Artist ID.',
      },
      fields: {
        albums: 'The albums on this page.',
      },
    },
    'get-artists-id-tracks': {
      title: 'List an artist\'s credited tracks',
      summary: 'Albums this artist worked on: any role on a track, plus album-wide roles other than "Artists & release". Grouped by album, listing the album-wide roles and the tracks worked on.',
      params: {
        id: 'Artist ID.',
        role: 'Only this role, for example `composer`. Role keys are in `credit_roles` of [/catalog/schema](#get-catalog-schema).',
      },
      fields: {
        'albums': 'The albums on this page, one group each. Pagination counts albums.',
        'albums.album': 'The album.',
        'albums.roles': 'Roles on the whole album.',
        'albums.roles.role': 'Role key.',
        'albums.roles.credited_as': 'The credited name; only present when it differs from the artist\'s name.',
        'albums.roles.detail': 'Extra detail, such as the exact instrument.',
        'albums.tracks': 'The tracks worked on, by disc and track number.',
        'albums.tracks.id': 'Track ID.',
        'albums.tracks.title': 'Track title (original).',
        'albums.tracks.disc_position': 'Disc number.',
        'albums.tracks.track_number': 'Track number.',
        'albums.tracks.number_label': 'The number for display, such as `A1` on a vinyl.',
        'albums.tracks.roles': 'Roles on this track, in the same format as `albums.roles`.',
        'roles': 'The number of albums for each role, for example `{ "composer": 4 }`. Not affected by the `role` parameter.',
        'all': 'The total number of albums worked on.',
      },
    },
    'get-artists-id-card': {
      title: 'Get an artist card',
      summary: 'A short profile of one artist, suited to hover cards: up to 4 other names, and the first 160 characters of the bio.',
      params: {
        id: 'Artist ID.',
      },
      fields: {
        id: 'Artist ID.',
        name: 'Name (original).',
        type: 'Artist type.',
        image_url: 'Avatar.',
        is_active: 'Whether still active; `false` once a person has died or a group has disbanded.',
        bio: 'The start of the bio, at most 160 characters, cut as is; may contain Markdown syntax.',
        albums_count: 'Number of albums worked on.',
        followers_count: 'Number of people who favorited this artist.',
      },
    },
    'get-artists-lookup': {
      title: 'Look up artists by name',
      summary: 'Find artists by exact name, up to 100 at a time; useful for matching the names in a credits list to artists. Full-width and half-width characters, case, kana, and Simplified, Traditional and Japanese kanji are normalized before comparing.',
      params: {
        'names[]': 'Names to look up, up to 200 characters each.',
      },
      fields: {
        'matches': 'Results grouped by the names you passed.',
        'matches.<name>': 'Artists that match this name exactly; there may be several with the same name, or none (an empty array). Compares the main name, official names, translations, readings and aliases, but not abbreviations.',
        'matches.<name>.id': 'Artist ID.',
        'matches.<name>.name': 'Name (original).',
        'matches.<name>.type': 'Artist type.',
        'matches.<name>.image_url': 'Avatar.',
      },
    },
    'get-event-series': {
      title: 'List event series',
      summary: 'All event series, sorted by name, not paginated.',
      fields: {
        event_series: 'Event series, with `latest_start_date`.',
      },
    },
    'get-event-series-id': {
      title: 'Get an event series',
      summary: 'One event series. Get the events in the series a page at a time with `series_id` on [List events](#get-events).',
      params: {
        id: 'Event series ID.',
      },
    },
    'get-events': {
      title: 'List events',
      summary: 'Filter events and return them a page at a time, most recent first by default.',
      params: {
        series_id: 'Only list events in this event series.',
        search: 'Search names and slugs: 2 to 100 characters without spaces, at most 3 words, and every word must match.',
        start_from: 'Starts on or after this day (`YYYY-MM-DD`).',
        start_to: 'Starts on or before this day (`YYYY-MM-DD`).',
        sort: '`start_date` by start date, `released_albums_count` by the number of albums first released there.',
      },
      fields: {
        events: 'The events on this page, without the detail-only fields.',
      },
    },
    'get-events-id': {
      title: 'Get an event',
      summary: 'One event; adds the booth count, whether there is a venue map, and the share card to what the list has.',
      params: {
        id: 'Event ID.',
      },
    },
    'get-events-id-map': {
      title: 'Get a venue map',
      summary: 'An event\'s venue floor plan: halls, where each space is, and the background shapes, converted from the organizer\'s floor plan.',
      params: {
        id: 'Event ID.',
      },
      statuses: {
        RESOURCE_NOT_FOUND: 'The event doesn\'t exist, or this event has no venue map yet (check `has_map` on the event detail first).',
      },
      notes: md`
        The data is fairly large; responses carry \`ETag\` and \`Cache-Control: public, max-age=60\`, so send \`If-None-Match\` on repeat requests. Coordinates are in pt of the floor plan PDF, with the y axis pointing down.
      `,
    },
    'get-events-id-booths': {
      title: 'List booths',
      summary: 'All booths of an event, in the organizer\'s list order, returned all at once. Booths are kept as the organizer\'s data has them; a booth can be linked to zero or more artists.',
      params: {
        id: 'Event ID.',
      },
      fields: {
        booths: 'All booths; an empty array until they have been imported.',
      },
      notes: md`
        Like the venue map, responses carry \`ETag\` and \`Cache-Control: public, max-age=60\`. The text and circle cuts in booths come from the organizer, and \`is_adult\` is only a flag.
      `,
    },
    'get-entries': {
      title: 'List entries',
      summary: 'Filter entries and return them a page at a time. Pending entries are left out of the list by default.',
      params: {
        type: 'Entry type.',
        format: 'Format; the possible values depend on the type, see [entry_type](#enum-entry-type).',
        platform: 'Game platform, exact match only, for example `Switch`.',
        franchise_id: 'Only list entries in this franchise (including its child franchises).',
        year: 'Release year.',
        search: 'Search names, other names (including aliases and abbreviations) and slugs. Without `sort`, results are sorted by relevance.',
        sort: 'What to sort by.',
      },
      fields: {
        entries: 'The entries on this page, without the detail-only fields.',
      },
    },
    'get-entries-id': {
      title: 'Get an entry',
      summary: 'One entry, with external links, linked albums, the franchises it belongs to and related entries.',
      params: {
        id: 'Entry ID.',
      },
    },
    'get-franchises': {
      title: 'List franchises',
      summary: 'Filter franchises and return them a page at a time. By default only top-level franchises are listed; searches include child franchises. Pending franchises are left out of the list by default.',
      params: {
        search: 'Search names, other names and slugs. Without `sort`, results are sorted by relevance.',
        parent_id: 'Only list the child franchises of this franchise.',
        top_level: '`true` lists only top-level franchises, `false` lists all. Defaults to `true` without `search` and `false` with `search`; has no effect when `parent_id` is passed.',
        sort: 'What to sort by. Entry and album counts include child franchises.',
      },
      fields: {
        franchises: 'The franchises on this page, without the detail-only fields.',
      },
    },
    'get-franchises-id': {
      title: 'Get a franchise',
      summary: 'One franchise, with its child franchises (and their entries), the entries directly in it, and the albums for the whole franchise.',
      params: {
        id: 'Franchise ID.',
      },
    },
    'get-franchises-id-albums': {
      title: 'List a franchise\'s albums',
      summary: 'All albums in a franchise and its child franchises: albums linked through entries, plus albums for the whole franchise, deduplicated, paginated and sorted by release date.',
      params: {
        id: 'Franchise ID.',
        entry_id: 'Only albums linked to this entry.',
        relation_type: 'Only albums with this relation to entries in the franchise, for example `ost`. When passed, albums for the whole franchise are left out.',
        sort: 'Release date only.',
      },
      fields: {
        'albums': 'The albums on this page.',
        'albums.entries': 'The entries in this franchise that the album is linked to; an empty array for albums for the whole franchise.',
        'albums.entries.id': 'Entry ID.',
        'albums.entries.name': 'Entry name (original).',
        'albums.entries.type': 'Entry type.',
        'albums.entries.relation_type': 'How the album relates to the entry.',
      },
    },
    'get-search': {
      title: 'Search',
      summary: 'Search albums, tracks, artists, entries and franchises. Without `type`, returns the top few results of each kind; with `type`, searches only that kind and returns a page at a time.',
      params: {
        q: 'Search terms. At least 2 characters without spaces, or 1 if it has kanji, kana or hangul; at most 3 words, and every word must match.',
        type: 'Search only this kind; results are paginated.',
        include_pending: 'Also search pending content. Search includes it by default, ranked after reviewed content on equal scores.',
        limit: 'Without `type`, the most results to return for each kind.',
      },
      fields: {
        'query': 'The terms actually searched for.',
        'query.phrase': 'The cleaned-up search terms.',
        'query.terms': 'The words they were split into, at most 3.',
        'groups': 'Returned without `type`: one group per kind, in a fixed order (albums, tracks, artists, entries, franchises); kinds without results are included too.',
        'groups.type': 'The kind of this group.',
        'groups.total': 'The number of results of this kind, counted up to 1000.',
        'groups.total_is_capped': '`true` when there are more than 1000 results.',
        'groups.items': 'The top few results of this kind.',
        'results': 'Returned with `type`: the results on this page.',
        'total_is_capped': 'Returned with `type`: `true` when there are more than 1000 results; `pagination.total` is at most 1000.',
      },
      notes: md`
        Search has its own rate limit of {{search_limit}} requests per minute, see [Rate limits](#rate-limits). Latin-script words of 3 or more letters allow a few typos; catalog numbers must match exactly.
      `,
    },
    'get-catalog-schema': {
      title: 'Get the catalog schema',
      summary: 'Every enum the API uses, plus the credit roles, attribute definitions and link providers maintained by staff, with names in four languages.',
      fields: {
        'enums': 'Enums: the key is the name (such as `album_type`), the value is every possible value.',
        'credit_roles': 'Credit roles; `credits[].role` is a `key` from here.',
        'credit_roles.key': 'Role key, for example `composer`.',
        'credit_roles.category': 'Role category.',
        'credit_roles.names': 'Names in each language, for example `{ "ja": "作曲", "en": "Composer" }`.',
        'credit_roles.aliases': 'Common spellings on other sites, useful for mapping other sites\' credits lists.',
        'credit_roles.is_album_role': 'Whether it can be used for a whole album.',
        'credit_roles.is_track_role': 'Whether it can be used for a single track.',
        'attribute_definitions': 'Attribute definitions: extra details that albums, tracks, images and artists can carry, such as "cover character".',
        'attribute_definitions.key': 'Attribute key, the `key` of an Attribute.',
        'attribute_definitions.names': 'Names in each language.',
        'attribute_definitions.description': 'Instructions for filling it in, in each language.',
        'attribute_definitions.group': 'Group, for example "Touhou Project".',
        'attribute_definitions.value_type': 'Value type.',
        'attribute_definitions.choices': 'The possible values for the `choice` type.',
        'attribute_definitions.reference_types': 'What a `reference` type can point to, for example `entry`.',
        'attribute_definitions.applies_to': 'What it can be attached to: `album`, `track`, `album_image`, `artist`.',
        'attribute_definitions.is_multiple': 'Whether it can have more than one value.',
        'link_providers': 'Link providers, the same as [List link providers](#get-link-providers).',
        'aggregates': 'Data structure notes for the editor; not needed for reading data.',
        'limits': 'Image upload limits; not needed for reading data.',
      },
    },
    'get-link-providers': {
      title: 'List link providers',
      summary: 'All providers of external links (official sites, social networks, streaming, shops, databases and so on), in display order, not paginated.',
      fields: {
        link_providers: 'Link providers.',
      },
    },
  },

  models: {
    AlbumSimple: {
      title: 'Album (simple)',
      description: 'The compact album used in lists, search, and artist and entry pages. It has no `titles` and can only show the original name.',
      fields: {
        id: 'Album ID. The web page is at `{{site}}/albums/{id}`.',
        title: 'Original name, the one printed on the release.',
        type: 'Album type.',
        categories: 'Album categories; there can be several. An empty array means a composer\'s own collection that isn\'t tied to any work.',
        release_date: 'Release date.',
        catalog_number: 'Catalog number, from the first edition that has one; can be a range, for example `KECH-8059~62`.',
        image_url: 'Cover, at most 1200px on the long side.',
        disc_count: 'Number of discs: the discs in the first edition, not counting bonus discs.',
        track_count: 'Number of tracks on those discs.',
        duration: 'Total length of those tracks (seconds); tracks of unknown length aren\'t counted.',
        disc_formats: 'The formats of those discs, deduplicated.',
        is_adult: 'Adult content flag.',
        favorites_count: 'Number of favorites.',
        reviews_count: 'Number of reviews.',
        views_count: 'Number of views, updated every 5 minutes.',
        byline: 'The byline under the title: every publisher when there is one, otherwise the credited artists; `null` when there are neither.',
      },
    },
    Album: {
      title: 'Album',
      description: 'The album detail.',
      fields: {
        'description': 'Description.',
        'banner_url': 'Banner image for the album page.',
        'release_event': 'Release event.',
        'release_event.id': 'Event ID.',
        'release_event.name': 'Event name.',
        'release_event.slug': 'The event\'s slug.',
        'release_event.main_visual_url': 'The event\'s main visual.',
        'release_event.start_date': 'The date the event starts.',
        'cover': 'Cover image, with the addresses of the original and two thumbnails.',
        'discs': 'Discs, in order, each with its tracks.',
        'tracklist_languages': 'The languages the tracklist has names in, and how many tracks have a name in each.',
        'tracklist_languages.locale': 'Language (BCP 47).',
        'tracklist_languages.kind': 'Kind of name: `official`, `translation` or `transliteration`.',
        'tracklist_languages.count': 'Number of tracks with a name in this language.',
        'tracklist_languages.total': 'Total number of tracks.',
        'credits': 'Credits for the whole album, including the "Artists & release" group (`category` is `release`).',
        'products': 'Editions, for example a first-press limited edition and a regular edition.',
        'bonuses': 'Bonuses, for example store bonuses and event bonuses.',
        'images': 'Album images: cover, back, booklet, disc and so on.',
        'attributes': 'Extra details, such as the cover character.',
        'streaming': 'Streaming links, kept apart from the other links.',
        'entries': 'Linked entries (source works).',
        'entries.id': 'Entry ID.',
        'entries.name': 'Entry name (original).',
        'entries.type': 'Entry type.',
        'entries.format': 'The entry\'s format.',
        'entries.image_url': 'The entry\'s image.',
        'entries.release_date': 'The entry\'s release date.',
        'entries.relation_type': 'How the album relates to the entry, such as soundtrack or opening.',
        'entries.note': 'A note on the relation.',
        'entries.franchises': 'The franchises the entry belongs to.',
        'entries.franchises.id': 'Franchise ID.',
        'entries.franchises.name': 'Franchise name (original).',
        'entries.franchises.parent_id': 'Parent franchise ID; `null` for a top-level franchise.',
        'franchises': 'Only for albums that belong directly to a whole franchise, such as anniversary compilations.',
        'franchises.id': 'Franchise ID.',
        'franchises.name': 'Franchise name (original).',
        'franchises.image_url': 'The franchise\'s image.',
        'tracking_stats': 'How many users have marked each tracking status.',
        'tracking_stats.plan_to_listen': 'Plan to Listen.',
        'tracking_stats.completed': 'Completed.',
        'tracking_stats.wishlist': 'Wishlist.',
        'tracking_stats.owned': 'Owned.',
        'tracking_stats.dropped': 'Dropped.',
        'rating': 'Average rating, 1 to 5, to two decimal places; `null` when nobody has rated it.',
        'rating_count': 'Number of ratings.',
        'rating_distribution': 'How many people gave each score from 1 to 5; `null` when nobody has rated it.',
        'ranking': 'Rating ranking, updated once a day; `null` until somebody has rated it.',
        'articles': 'Articles about this album, up to 5.',
        'articles.id': 'Article ID.',
        'articles.title': 'Article title.',
        'articles.cover_url': 'The article\'s cover image.',
        'articles.published_at': 'When it was published (UTC).',
        'contributors': 'Users who have edited this album, updated once a day.',
        'contributors.username': 'Username.',
        'contributors.nickname': 'Nickname.',
        'contributors.avatar_url': 'Avatar.',
        'user_tracking': 'The tracking status the current user has marked. Only meaningful when signed in on the site; always `null` for other requests.',
        'user_tracking.status': 'Status: `plan_to_listen`, `completed`, `wishlist`, `owned` or `dropped`.',
        'edited_at': 'When the current version was edited (UTC). Unlike `updated_at`, changes such as the view count don\'t affect it.',
      },
    },
    Disc: {
      title: 'Disc',
      description: 'One disc in an album: CD, BD, vinyl, digital and so on.',
      fields: {
        id: 'Disc ID.',
        position: 'Disc number, starting at 1.',
        title: 'Disc title, for example "DISC 2 Instrumental"; `null` when there is none.',
        format: 'Format.',
        bonus_id: 'Only for discs that come with a bonus; points to that bonus.',
        tracks: 'The tracks on this disc, by track number.',
      },
    },
    AlbumTrack: {
      title: 'Album track',
      description: 'A track in the album detail, with its own credits and originals.',
      fields: {
        id: 'Track ID.',
        disc_number: 'Disc number.',
        track_number: 'Track number, unique within a disc.',
        number_label: 'The number for display; only present when it differs from the track number, such as `A1` on a vinyl.',
        title: 'Track title, the one printed on the release.',
        duration: 'Length (seconds); `null` when unknown.',
        is_instrumental: 'Whether it is an instrumental.',
        isrc: 'International Standard Recording Code.',
        favorites_count: 'Number of favorites.',
        has_lyrics: 'Whether it has original lyrics.',
        lyrics_count: 'Number of lyrics, including translations.',
        translations_count: 'How many of them are translations.',
        originals: 'Originals: the pieces this track arranges, covers or remixes.',
        credits: 'This track\'s credits.',
        attributes: 'Extra details, such as BPM.',
      },
    },
    Track: {
      title: 'Track',
      description: 'The track detail.',
      fields: {
        'id': 'Track ID.',
        'album_id': 'ID of its album.',
        'disc_id': 'ID of its disc.',
        'disc_number': 'Disc number.',
        'track_number': 'Track number.',
        'number_label': 'The number for display, such as `A1` on a vinyl.',
        'title': 'Track title (original).',
        'duration': 'Length (seconds); `null` when unknown.',
        'is_instrumental': 'Whether it is an instrumental.',
        'isrc': 'International Standard Recording Code.',
        'has_lyrics': 'Whether it has original lyrics.',
        'lyrics_count': 'Number of lyrics, including translations.',
        'translations_count': 'How many of them are translations.',
        'favorites_count': 'Number of favorites.',
        'originals': 'Originals.',
        'derived_tracks': 'Tracks that have this track as their original, such as its arrangements and covers.',
        'derived_tracks.id': 'Track ID.',
        'derived_tracks.title': 'Track title (original).',
        'derived_tracks.album': 'The album that track is on.',
        'album': 'Its album.',
        'album_tracks': 'Every track on the same album, by disc and track number, for previous and next track links.',
        'album_tracks.id': 'Track ID.',
        'album_tracks.disc_number': 'Disc number.',
        'album_tracks.track_number': 'Track number.',
        'album_tracks.number_label': 'The number for display.',
        'album_tracks.title': 'Track title (original).',
        'album_tracks.duration': 'Length (seconds).',
        'album_tracks.has_lyrics': 'Whether it has original lyrics.',
        'credits': 'This track\'s credits.',
        'credits.id': 'ID.',
        'credits.role': 'Role key; names are in `credit_roles` of `/catalog/schema`.',
        'credits.detail': 'Extra detail, such as the exact instrument or character name.',
        'credits.credited_as': 'The credited name; only present when it differs from the artist\'s name.',
        'credits.artist': 'The artist; `null` when only the credited name is known and no artist is matched yet.',
        'credits.artist.id': 'Artist ID.',
        'credits.artist.name': 'Artist name (original).',
        'attributes': 'Extra details.',
      },
    },
    Credit: {
      title: 'Credit',
      description: 'One role of an artist on an album or track. An artist with several roles has one credit for each.',
      fields: {
        'id': 'ID.',
        'role': 'Role key, for example `composer`; names are in `credit_roles` of `/catalog/schema`. The 6 roles of the "Artists & release" group are in [release_role](#enum-release-role).',
        'category': 'Role category.',
        'artist': 'The artist; `null` when only the credited name is known and no artist is matched yet.',
        'artist.id': 'Artist ID.',
        'artist.name': 'Artist name (original).',
        'artist.image_url': 'Avatar.',
        'artist.type': 'Artist type.',
        'credited_as': 'The credited name, as printed on the album; only present when it differs from the artist\'s name.',
        'detail': 'Extra detail, such as the exact instrument or the character voiced.',
      },
    },
    Product: {
      title: 'Edition',
      description: 'One version you can buy, such as a first-press limited edition, a regular edition or a digital release, each ticking the discs it contains.',
      fields: {
        id: 'Edition ID.',
        name: 'Edition name, for example "初回限定盤".',
        edition_type: 'Regular or limited edition.',
        limited_rule: 'How it is limited; only for limited editions.',
        limited_name: 'Name of the limited edition.',
        medium: 'Physical or digital.',
        catalog_number: 'Catalog number.',
        barcode: 'Barcode (JAN / EAN / UPC).',
        release_date: 'This edition\'s release date; when `null`, the same as the album\'s.',
        region: 'Release region, a two-letter ISO 3166-1 code, for example `JP`.',
        price: 'List price, as a string, for example `"3300.00"`.',
        currency: 'Currency, an ISO 4217 code, for example `JPY`.',
        is_hires: 'Whether it is hi-res audio.',
        is_available: 'Whether it is still on sale.',
        sort_order: 'Display order.',
        disc_ids: 'IDs of the discs in this edition.',
        format_label: 'The format for display, for example `2CD+BD`; `DL` for a digital release.',
      },
    },
    Bonus: {
      title: 'Bonus',
      description: 'Store bonuses, event bonuses, first-press bonuses and so on. A bonus CD is a disc whose `bonus_id` points to the bonus.',
      fields: {
        'id': 'Bonus ID.',
        'name': 'Bonus name.',
        'type': 'Bonus type.',
        'description': 'Description.',
        'is_digital': 'Whether it is a digital bonus.',
        'shop': 'Store name, for example "とらのあな".',
        'availability': 'How to get it.',
        'note': 'Conditions, for example "購入者全員" or "抽選".',
        'sort_order': 'Display order.',
        'event': 'The event an event bonus is for.',
        'event.id': 'Event ID.',
        'event.name': 'Event name.',
        'event.slug': 'The event\'s slug.',
        'product_ids': 'Which editions it comes with; an empty array means every edition.',
        'disc_ids': 'The discs that come with this bonus.',
      },
    },
    AlbumImage: {
      title: 'Album image',
      description: 'What an image is used for in an album: cover, back, a booklet page and so on.',
      fields: {
        id: 'ID.',
        kind: 'Image kind.',
        label: 'Extra detail, such as the booklet page "p. 01-02".',
        caption: 'Caption.',
        product_id: 'Only present when it belongs to one edition.',
        bonus_id: 'Only present when it belongs to one bonus.',
        disc_id: 'Only present when it belongs to one disc.',
        sort_order: 'Display order.',
        image: 'The image file.',
        attributes: 'Extra details, such as the cover character.',
      },
    },
    Original: {
      title: 'Original',
      description: 'The piece a track arranges, covers or remixes: another track in the catalog, or just a line of text.',
      fields: {
        'title': 'Title of the original. When it points to a track in the catalog, that track\'s title.',
        'track': 'Only present when the original is a track in the catalog; otherwise `null`.',
        'track.id': 'Track ID of the original.',
        'track.album': 'The album the original is on.',
        'track.album.id': 'Album ID.',
        'track.album.title': 'Album title (original).',
      },
    },
    LyricSummary: {
      title: 'Lyrics (summary)',
      description: 'A summary of one set of lyrics, without the text.',
      fields: {
        'id': 'Lyrics ID.',
        'track_id': 'Track ID.',
        'kind': 'Original, translation or transliteration.',
        'language': 'Language (BCP 47), for example `ja`, `zh-Hans`, `ja-Latn`.',
        'translation_of_id': 'Only for translations and transliterations: the ID of the original lyrics they correspond to, for line-by-line comparison.',
        'format': 'Format of the text.',
        'translator': 'The translator\'s credited name.',
        'is_ai_generated': 'Whether it is a machine translation.',
        'creator': 'The user who first submitted these lyrics; `null` once the account is deleted.',
        'creator.id': 'User ID.',
        'creator.username': 'Username.',
        'creator.nickname': 'Nickname.',
        'creator.avatar_url': 'Avatar.',
      },
    },
    Lyric: {
      title: 'Lyrics',
      description: 'One full set of lyrics.',
      fields: {
        'content': 'The text. Timed when the format is `lrc` or `srt`.',
        'source': 'Source, for example "歌詞カード".',
        'track': 'Its track.',
        'track.id': 'Track ID.',
        'track.title': 'Track title (original).',
        'track.track_number': 'Track number.',
        'track.disc_number': 'Disc number.',
        'track.album': 'Its album.',
      },
    },
    Artist: {
      title: 'Artist',
      description: 'Used for both lists and the detail. Fields marked "Not always present" are only returned in the detail.',
      fields: {
        'id': 'Artist ID. The web page is at `{{site}}/artists/{id}`.',
        'name': 'Main name, usually the original.',
        'type': 'Artist type.',
        'is_active': 'Whether still active; `false` once a person has died or a group has disbanded.',
        'bio': 'Bio, in Markdown.',
        'image_url': 'Avatar.',
        'followers_count': 'Number of people who favorited this artist.',
        'albums_count': 'Number of albums worked on, in any role.',
        'releases_count': 'Number of "Releases", see [List an artist\'s releases](#get-artists-id-albums).',
        'credited_albums_count': 'Number of albums under "Credits", see [List an artist\'s credited tracks](#get-artists-id-tracks).',
        'catalog_prefixes': 'Catalog number prefixes, for example `["LACA"]`; only for companies and circles that also act as labels.',
        'shouts_count': 'Number of comments on the artist page.',
        'attributes': 'Extra details.',
        'relations': 'Related artists, described from this artist\'s side.',
        'relations.artist': 'The other artist.',
        'relations.artist.id': 'Artist ID.',
        'relations.artist.name': 'Name (original).',
        'relations.artist.image_url': 'Avatar.',
        'relations.artist.type': 'Artist type.',
        'relations.relation_type': 'The relation, for example `has_member` means the other artist is a member of this group.',
        'relations.note': 'A note.',
      },
    },
    EventSeries: {
      title: 'Event series',
      description: 'For example M3 or Comic Market.',
      fields: {
        id: 'Event series ID. The web page is at `{{site}}/event-series/{id}`.',
        name: 'Name.',
        slug: 'Slug.',
        location: 'City or region where it is held.',
        description: 'Description, an object split by language, for example `{ "ja": "…", "en": "…" }`; not every language is always there.',
        website: 'Official site.',
        banner_url: 'Banner image.',
        visual_orientation: 'Orientation of each event\'s main visual: portrait (catalog cover) or landscape.',
        events_count: 'Number of events held.',
        latest_start_date: 'Start date of the most recent event. Only in the list.',
      },
    },
    Event: {
      title: 'Event',
      description: 'One event. Fields marked "Not always present" are only returned in the detail.',
      fields: {
        'id': 'Event ID. The web page is at `{{site}}/events/{id}`.',
        'event_series_id': 'Its event series; `null` for a standalone event.',
        'series': 'Its event series.',
        'series.id': 'Event series ID.',
        'series.name': 'Name.',
        'series.slug': 'Slug.',
        'series.website': 'Official site.',
        'series.visual_orientation': 'Orientation of the main visual.',
        'name': 'Name, for example "M3-2026秋".',
        'slug': 'Slug.',
        'start_date': 'Start date.',
        'end_date': 'End date; `null` for a one-day event.',
        'start_time': 'Opening time `HH:MM`, local time at the venue.',
        'end_time': 'Closing time `HH:MM`.',
        'venue': 'Venue.',
        'location': 'City or region.',
        'website_url': 'This event\'s own site; the series\' official site is in `series.website`.',
        'description': 'Description, an object split by language.',
        'main_visual_url': 'Main visual or catalog cover.',
        'main_visual_width': 'Width of the main visual (pixels).',
        'main_visual_height': 'Height of the main visual (pixels).',
        'key_visuals': 'Other visuals; the format isn\'t settled yet, so please don\'t rely on it.',
        'meta': 'Extra data written on import, such as the names of booth genre codes; the format may change.',
        'albums_count': 'Number of albums released, entered by hand by staff and not updated automatically; use `released_albums_count` instead.',
        'artists_count': 'Number of participating circles, entered by hand by staff and not updated automatically.',
        'released_albums_count': 'Number of albums first released at this event, counted live, including pending albums.',
        'booths_count': 'Number of booths, including those taking part off-site.',
        'has_map': 'Whether there is a venue map.',
      },
    },
    EventMap: {
      title: 'Venue map',
      description: 'An event\'s floor plan. Coordinates are in pt of the floor plan PDF, with the origin at the top left and the y axis pointing down.',
      fields: {
        'width': 'Width of the whole map.',
        'height': 'Height of the whole map.',
        'background': 'Background shapes such as walls, pillars and areas, in drawing order.',
        'background.d': 'SVG path data.',
        'background.s': 'Lightness: 0 is a wall, 1 is the floor.',
        'background.e': 'When `1`, use the even-odd fill rule.',
        'background.w': 'Stroke width; when absent, fill only.',
        'labels': 'Text in the venue and block letters.',
        'labels.text': 'The text.',
        'labels.x': 'x of the position.',
        'labels.y': 'y of the position.',
        'labels.size': 'Font size.',
        'labels.rotate': 'Rotation (degrees).',
        'labels.vertical': 'Whether it is set vertically.',
        'labels.kind': 'When `area`, it is a block letter (A, あ…).',
        'halls': 'Halls and floors, in order.',
        'halls.id': 'Hall ID, the `hall_id` in `spaces`.',
        'halls.building': 'Building, for example "第一展示場".',
        'halls.floor': 'Floor, for example `2F`.',
        'halls.name': 'Name for display.',
        'halls.bbox': 'The hall\'s extent on the map `[x, y, w, h]`.',
        'spaces': 'One item per space (table), written as an array `[id, hall_id, area, number, x, y, w, h]`. A booth\'s `space_id` points to the `id` here.',
        'genres': 'Names of the booth genre codes, for example `{ "201": { "label": "オリジナル", "group": "music" } }`.',
      },
    },
    EventBooth: {
      title: 'Booth',
      description: 'One exhibitor entry from the organizer\'s list, kept as it is: a booth may be run by several circles together, and its name may include a reading or a note.',
      fields: {
        'id': 'Booth ID.',
        'space_id': 'The space it is at, the `id` in the venue map\'s `spaces`; `null` for booths taking part off-site.',
        'space_code': 'Space number, for example `A-01a`.',
        'area': 'Block, for example `A`.',
        'sub': 'Which part of the table it takes: `a` and `b` are halves, `ab` is the whole table, `x`, `y`, `z` are thirds for mini booths.',
        'name': 'Booth name, as the organizer has it.',
        'name_kana': 'Reading of the name.',
        'description': 'The description in the organizer\'s list.',
        'genre': 'Genre code; names are in the venue map\'s `genres`.',
        'keywords': 'Keywords.',
        'links': 'Links in the organizer\'s list.',
        'links.type': 'Kind of link, for example `website`.',
        'links.url': 'Address.',
        'twitter_handle': 'X (Twitter) handle, lowercase, without the @.',
        'image_url': 'Circle cut, already stored on CDCat.',
        'embeds': 'Embedded videos.',
        'embeds.type': 'Only `youtube` for now.',
        'embeds.id': 'Video ID.',
        'is_adult': 'Adult content flag; the API doesn\'t filter it.',
        'artists': 'Linked artists; there can be several, or none.',
        'artists.id': 'Artist ID.',
        'artists.name': 'Name (original).',
        'artists.image_url': 'Avatar.',
        'album_ids': 'IDs of the albums these artists first released at this event.',
      },
    },
    Entry: {
      title: 'Entry',
      description: 'Used for both lists and the detail. Fields marked "Not always present" are only returned in the detail.',
      fields: {
        'id': 'Entry ID. The web page is at `{{site}}/entries/{id}`.',
        'name': 'Main name, usually the original.',
        'type': 'Entry type.',
        'format': 'Format; the possible values depend on the type, see [entry_type](#enum-entry-type).',
        'platforms': 'Game platforms, for example `["Switch", "PC"]`; an empty array when it isn\'t a game.',
        'release_date': 'Release or first air date.',
        'description': 'Description, plain text.',
        'image_url': 'Image; may be hosted on another site.',
        'banner_url': 'Banner image.',
        'albums_count': 'Number of linked albums, including pending ones.',
        'albums': 'Linked albums, by release date.',
        'albums.relation_type': 'How the album relates to the entry.',
        'albums.note': 'A note on the relation.',
        'franchises': 'The franchises it belongs to.',
        'franchises.id': 'Franchise ID.',
        'franchises.name': 'Franchise name (original).',
        'franchises.image_url': 'The franchise\'s image.',
        'franchises.parent': 'Parent franchise; `null` for a top-level franchise.',
        'franchises.parent.id': 'Parent franchise ID.',
        'franchises.parent.name': 'Parent franchise name.',
        'related_entries': 'Related entries, described from this entry\'s side: `sequel` means the other entry is its sequel.',
        'related_entries.id': 'Entry ID.',
        'related_entries.name': 'Name (original).',
        'related_entries.type': 'Entry type.',
        'related_entries.format': 'Format.',
        'related_entries.image_url': 'Image.',
        'related_entries.release_date': 'Release date.',
        'related_entries.relation_type': 'The relation.',
        'related_entries.note': 'A note.',
        'sort_order': 'Only on entries in the franchise detail: its order within the franchise.',
      },
    },
    Franchise: {
      title: 'Franchise',
      description: 'Used for both lists and the detail. Fields marked "Not always present" are only returned in the detail. All counts include child franchises.',
      fields: {
        'id': 'Franchise ID. The web page is at `{{site}}/franchises/{id}`.',
        'name': 'Main name, usually the original.',
        'parent_id': 'Parent franchise ID; `null` for a top-level franchise.',
        'description': 'Description, plain text.',
        'image_url': 'Image; may be hosted on another site.',
        'banner_url': 'Banner image.',
        'sort_order': 'Order within the parent franchise.',
        'entries_count': 'Number of entries, including those of child franchises, deduplicated.',
        'albums_count': 'Number of albums: those linked through entries, plus those for the whole franchise, deduplicated.',
        'children_count': 'Number of child franchises.',
        'parent': 'Parent franchise; `null` for a top-level franchise. Child franchises in `children` don\'t have this field.',
        'parent.id': 'Parent franchise ID.',
        'parent.name': 'Parent franchise name.',
        'children': 'Child franchises, each with its counts, other names and entries, but no external links.',
        'entries': 'Entries directly in this franchise, by order and release date, with `sort_order`.',
        'albums': 'Albums for the whole franchise, such as anniversary compilations.',
        'albums.sort_order': 'Order within the franchise.',
      },
    },
    SearchResult: {
      title: 'Search result',
      description: 'One search result, shared by all five kinds.',
      fields: {
        'type': 'Kind of result.',
        'id': 'ID of the result itself.',
        'title': 'Original name.',
        'image_url': 'Image.',
        'meta': 'Data for the subtitle, by kind: albums have `artist_credit`, `catalog_number`, `release_date`, `release_date_precision`, `album_type`, `disc_formats`; tracks have `album_id`, `album_title`, `disc_number`, `track_number`, `duration`; artists have `artist_type`; entries have `entry_type`, `release_date`; franchises have `parent` (`{ id, name }` or `null`).',
        'album': 'Only for album and track results: the album, or the album the track is on.',
        'matched': 'Which name matched; `null` when the original name matched.',
        'matched.field': 'The field that matched.',
        'matched.text': 'The text that matched.',
        'matched.locale': 'Language of that name.',
      },
    },
    LinkProvider: {
      title: 'Link provider',
      description: 'The site an external link comes from, such as an official site, X or VGMdb.',
      fields: {
        id: 'Provider ID.',
        name: 'Identifier, for example `x` or `vgmdb`; not a display name.',
        icon_url: 'Icon.',
        url_pattern: 'URL wildcard pattern, for example `https://x.com/*`, useful for recognizing links users paste; `null` when there is none.',
        category: 'Category.',
      },
    },
    Title: {
      title: 'Other name',
      description: 'A name other than the original. At most one each of `official`, `translation` and `transliteration` per language; any number of aliases and abbreviations.',
      fields: {
        title: 'The name.',
        locale: 'Language (BCP 47), for example `ja`, `zh-Hans`, `en`; romanization is `ja-Latn`, kana readings are `ja-Hrkt`. May be `null` for aliases and abbreviations.',
        kind: 'Kind of name.',
      },
    },
    Link: {
      title: 'External link',
      description: 'A link to another site, such as an official site, social account, streaming service or database.',
      fields: {
        'id': 'Link ID.',
        'url': 'Address.',
        'external_id': 'The ID on that site, for example `subject/12345` on Bangumi; `null` when it can\'t be matched.',
        'is_verified': 'Whether it has been verified.',
        'provider': 'Link provider; `null` when the provider has been deleted.',
        'provider.id': 'Provider ID.',
        'provider.name': 'Identifier, for example `x`.',
        'provider.icon_url': 'Icon.',
        'provider.category': 'Category.',
      },
    },
    Image: {
      title: 'Image',
      description: 'An image uploaded to CDCat. When the original is smaller than a thumbnail, the thumbnail\'s address is the original\'s.',
      fields: {
        id: 'Image ID.',
        url: 'Original (WebP).',
        thumbnail_url: 'Thumbnail, at most 300px on the long side.',
        medium_url: 'Thumbnail, at most 1200px on the long side.',
        width: 'Width of the original (pixels).',
        height: 'Height of the original (pixels).',
        mime: 'MIME type, for example `image/webp`.',
      },
    },
    Byline: {
      title: 'Byline',
      description: 'The byline under the title, worked out when the album is saved.',
      fields: {
        'role': 'With `publisher`, every publisher of the whole album; with `artist`, every credited artist.',
        'artists': 'The credited artists, in credits order.',
        'artists.id': 'Artist ID; `null` when there is only a credited name and no matching artist.',
        'artists.name': 'The credited name; the artist\'s name when there is no separate credited name.',
      },
    },
    Attribute: {
      title: 'Attribute',
      description: 'Extra details defined by staff, such as the cover character or BPM. Definitions are in `attribute_definitions` of `/catalog/schema`.',
      fields: {
        id: 'ID.',
        key: 'Attribute key, for example `cover_character`.',
        value: 'The value; its type depends on the attribute: text, URL and choice are strings; integers are numbers; decimals are strings; booleans are `true` / `false`; dates are `{ date, precision }`; references are `{ type, id }`, for example `{ "type": "entry", "id": 12 }`.',
        label: 'Only for reference attributes: the name of the content it points to.',
        sort_order: 'Display order.',
      },
    },
    Pagination: {
      title: 'Pagination',
      description: 'Pagination info of a list endpoint.',
      fields: {
        total: 'Total number of items.',
        per_page: 'Items per page.',
        current_page: 'Current page number.',
        last_page: 'Number of the last page.',
      },
    },
    Error: {
      title: 'Error',
      description: 'The object in `error` when something goes wrong.',
      fields: {
        code: 'Numeric error code.',
        name: 'Error name, for example `RESOURCE_NOT_FOUND`. Use it to tell error types apart.',
        message: 'Description in English, for debugging only; may change.',
        details: 'For invalid parameters, the reasons by parameter name; when the rate limit is exceeded, `{ retry_after }`.',
      },
    },
  },

  enums: {
    album_type: {
      title: 'Album type',
      description: 'The form of the album, similar to Spotify\'s album_type.',
      values: {
        album: 'Album.',
        ep: 'EP or mini album.',
        single: 'Single.',
        compilation: 'Compilation or best-of.',
        drama: 'Drama CD or audio drama.',
        radio: 'CD of a radio show.',
      },
    },
    album_category: {
      title: 'Album category',
      description: 'Where the album\'s music comes from; there can be several. An empty array means a composer\'s own collection that isn\'t tied to any work.',
      values: {
        game: 'Game music, including music tied to games but not to a specific game.',
        animation: 'Anime music.',
        publication: 'Manga, light novels and other publications.',
        audio_drama: 'Audio dramas.',
        tokusatsu: 'Tokusatsu and puppet shows.',
        live_action: 'Films, TV dramas and stage plays.',
        doujin: 'Music made independently by doujin circles or individuals, original or derivative.',
        event: 'Music made for an event, such as the theme song of a convention, show or competition.',
      },
    },
    disc_format: {
      title: 'Disc format',
      description: 'Variants such as HQCD and SHM-CD are recorded as `cd`.',
      values: {
        cd: 'CD.',
        sacd: 'SACD.',
        dvd: 'DVD.',
        bd: 'Blu-ray.',
        vinyl: 'Vinyl.',
        cassette: 'Cassette.',
        digital: 'Digital (download or streaming).',
        other: 'Other.',
      },
    },
    date_precision: {
      title: 'Date precision',
      description: 'How precise a date is.',
      values: {
        day: 'Exact day.',
        month: 'Only the year and month are known; the date is set to the 1st of the month.',
        year: 'Only the year is known; the date is set to 1 January.',
      },
    },
    title_kind: {
      title: 'Name kind',
      description: 'What kind of name an other name (Title) is.',
      values: {
        official: 'An official name in another language, such as the English name printed on the back of the release.',
        translation: 'An unofficial translation.',
        transliteration: 'Transliteration, romanization or kana reading.',
        alias: 'Alias or former name.',
        abbreviation: 'Abbreviation.',
      },
    },
    artist_type: {
      title: 'Artist type',
      description: 'What the artist is.',
      values: {
        person: 'A person.',
        group: 'A group or band.',
        circle: 'A doujin circle.',
        company: 'A company: record company, label, publisher, production company or studio.',
        virtual: 'A virtual singer or VTuber.',
        character: 'A character who sings character songs.',
      },
    },
    artist_relation: {
      title: 'Artist relation',
      description: 'Described from the current artist\'s side; each side sees one of the pair.',
      values: {
        member_of: 'The current artist is a member of the other.',
        has_member: 'The other artist is a member of the current group.',
        voice_of: 'The current artist voices the other (a character).',
        voiced_by: 'The other artist voices the current character.',
        persona_of: 'The current artist is another name of the other.',
        has_persona: 'The other artist is another name of the current artist.',
        subunit_of: 'The current artist is a sub-unit of the other.',
        has_subunit: 'The other artist is a sub-unit of the current group.',
        related: 'Otherwise related.',
      },
    },
    credit_role_category: {
      title: 'Role category',
      description: 'Groups of credit roles. The roles themselves are in `credit_roles` of `/catalog/schema`.',
      values: {
        release: 'Artists & release: artist, publisher, label and so on, see [release_role](#enum-release-role).',
        composition: 'Composition.',
        lyrics: 'Lyrics.',
        arrangement: 'Arrangement and remixing.',
        vocals: 'Vocals, backing vocals and voice acting.',
        performance: 'Performance, orchestra and conducting.',
        production: 'Producing and directing.',
        engineering: 'Recording, mixing and mastering.',
        artwork: 'Illustration, design and photography.',
        other: 'Other.',
      },
    },
    release_role: {
      title: 'Artists & release',
      description: 'The 6 roles of the "Artists & release" group, part of `credits[].role`. The album\'s byline (Byline) is worked out from these.',
      values: {
        artist: 'Artist: the artist credited on the cover or on the tracks.',
        publisher: 'Publisher (発売元), for whole albums only.',
        label: 'Label (レーベル), for whole albums only.',
        distributor: 'Distributor (販売元), for whole albums only.',
        manufacturer: 'Manufacturer (製造元), for whole albums only.',
        planning: 'Planning (企画), for whole albums only.',
      },
    },
    edition_type: {
      title: 'Edition type',
      description: 'Regular or limited edition.',
      values: {
        regular: 'Regular edition.',
        limited: 'Limited edition; how it is limited is in `limited_rule`.',
      },
    },
    limited_rule: {
      title: 'Limitation',
      description: 'The conditions for getting a limited edition or a bonus.',
      values: {
        first_press: 'First press.',
        count: 'Limited quantity.',
        period: 'Limited time.',
        shop: 'Store exclusive.',
        event: 'Event exclusive.',
        region: 'Region exclusive.',
      },
    },
    product_medium: {
      title: 'Edition medium',
      description: 'Physical or digital.',
      values: {
        physical: 'Physical.',
        digital: 'Digital (download or streaming).',
      },
    },
    bonus_type: {
      title: 'Bonus type',
      description: 'What the bonus is.',
      values: {
        bonus_track: 'Bonus track.',
        bonus_disc: 'Bonus disc.',
        booklet: 'Booklet.',
        photo_item: 'Photos, cards and the like.',
        goods: 'Merchandise.',
        digital_content: 'Digital content.',
        serial_code: 'Serial code.',
        event_entry: 'Event entry ticket.',
        signed_item: 'Signed item.',
        other: 'Other.',
      },
    },
    image_kind: {
      title: 'Image kind',
      description: 'What an image is used for in an album, based on VGMdb\'s categories.',
      values: {
        cover: 'Album cover, square; exactly one per album.',
        front: 'Front.',
        back: 'Back.',
        booklet: 'Booklet; the page numbers go in `label`.',
        disc: 'Disc.',
        disc_back: 'Disc back.',
        obi_front: 'Obi front.',
        obi_back: 'Obi back.',
        tray: 'Tray.',
        box: 'Box.',
        sticker: 'Sticker.',
        bonus_item: 'Bonus item.',
        illustration: 'Illustration.',
        other: 'Other.',
      },
    },
    lyric_kind: {
      title: 'Lyrics kind',
      description: 'Whether a set of lyrics is the original, a translation or a transliteration.',
      values: {
        original: 'Original; at most one per track.',
        translation: 'Translation.',
        transliteration: 'Transliteration or romanization.',
      },
    },
    lyric_format: {
      title: 'Lyrics format',
      description: 'How the lyrics text is written.',
      values: {
        plain: 'Plain text.',
        lrc: 'LRC, timed.',
        srt: 'SRT subtitles, timed.',
      },
    },
    entry_type: {
      title: 'Entry type',
      description: 'What kind of work the entry is. Its `format` depends on the type: anime has `tv`, `movie`, `ova`, `web`, `special`; games have `full`, `dlc`, `expansion`; TV dramas have `series`, `special`; books have `novel`, `light_novel`, `other`; manga has `serial`, `oneshot`; stage has `musical`, `play`; films and other have no format.',
      values: {
        anime: 'Anime, including anime films.',
        game: 'Game.',
        movie: 'Live-action film.',
        tv: 'Live-action TV drama.',
        book: 'Book.',
        manga: 'Manga.',
        stage: 'Stage play or musical.',
        other: 'Other.',
      },
    },
    entry_relation: {
      title: 'Entry relation',
      description: 'Described from the current entry\'s side; each side sees one of the pair.',
      values: {
        sequel: 'The other entry is a sequel to the current one.',
        prequel: 'The other entry is a prequel to the current one.',
        side_story: 'The other entry is a side story of the current one.',
        main_story: 'The other entry is the main story of the current one.',
        spin_off: 'The other entry is a spin-off of the current one.',
        spin_off_of: 'The current entry is a spin-off of the other.',
        adaptation: 'The other entry is an adaptation of the current one.',
        source: 'The other entry is the source of the current one.',
        remake: 'The other entry is a remake of the current one.',
        remake_of: 'The current entry is a remake of the other.',
        alternative: 'Another version.',
        shared_world: 'Same setting.',
        related: 'Otherwise related.',
      },
    },
    entry_album_relation: {
      title: 'Album–entry relation',
      description: 'What an album is to an entry.',
      values: {
        opening: 'Opening.',
        ending: 'Ending.',
        insert_song: 'Insert song.',
        theme_song: 'Theme song.',
        character_song: 'Character song.',
        image_song: 'Image song.',
        ost: 'Soundtrack.',
        drama: 'Drama.',
        other: 'Other.',
      },
    },
    attribute_value_type: {
      title: 'Attribute value type',
      description: 'The `value_type` of an attribute definition, which decides what the `value` of an Attribute is.',
      values: {
        text: 'Text.',
        integer: 'Integer.',
        decimal: 'Decimal, as a string.',
        date: 'Date, as `{ date, precision }`.',
        url: 'URL.',
        boolean: 'Yes or no.',
        choice: 'One of the `choices` in the definition.',
        reference: 'Points to content in the catalog, as `{ type, id }`.',
      },
    },
    link_category: {
      title: 'Link category',
      description: 'Link provider categories; streaming links are listed separately on albums.',
      values: {
        official: 'Official sites.',
        social: 'Social networks.',
        streaming: 'Streaming.',
        shop: 'Shops.',
        database: 'Databases, such as VGMdb, MusicBrainz and Bangumi.',
        other: 'Other.',
      },
    },
  },

  changes: {
    launch: 'First public release, in beta.',
  },
}

export default texts
