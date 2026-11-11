import type { EditorHelpEntry } from './types'

/** The album editor's field help. Facts follow /docs/editor (app/guides/editor); ids are used by <EditorHelp id="…">. */
const help: Record<string, EditorHelpEntry> = {
  // ── Basics
  'album.cover': {
    text: 'The album’s front cover: ideally square, at least 500 px on its short side. If it’s only slightly off, it’s cropped from the centre automatically; further off, you’re asked whether to crop it to a square or keep its shape (at most 2:1). Keep it only when the real cover isn’t square (a DVD case, a cassette): such a cover shows at its own shape on the album page only, and is cropped to a square everywhere else.',
    where: 'Album lists, cards and the top of the album page.',
  },
  'album.title': {
    text: 'Enter it in the original language, as printed on the cover.',
    dont: ['Don’t add edition notes such as “初回限定盤”. Those go in “Editions”.'],
    where: 'The album page, lists and search results. If there’s an official name or translation in the interface language, the album page shows that first, with this title below it. Lists and search results show only this title.',
  },
  'album.release_date': {
    text: 'Enter the year, month and day in that order: 4 digits for the year, 2 each for the month and day.',
    rows: [
      ['2026-10-25', 'Year-month-day, when you know the exact day'],
      ['2026-10', 'Year-month, when you only know the month'],
      ['2026', 'Year, when you only know the year'],
    ],
    where: 'The date tag under the title on the album page. Sorting by release date and filtering by year use it too.',
  },
  'album.release_event': {
    text: 'If it was first released at an event such as M3 or Comic Market, search for that event and pick it. Otherwise leave it empty.',
    examples: ['M3-2026 Autumn', 'C107'],
    where: 'The event tag under the title on the album page, which opens all albums from this event. The event page lists this album too.',
  },
  'album.catalog_number': {
    text: 'The first edition’s catalog number, usually printed on the obi or the back. With several editions, enter each one under “Editions”.\nThe format is tidied up when you leave the field.',
    rows: [
      ['KICA-1234', 'One disc'],
      ['KICA-1234~5', 'Several discs with consecutive numbers'],
      ['ABC-1 / ABC-3', 'Non-consecutive numbers, separated by /'],
    ],
    where: 'The catalog number tag under the title on the album page, the Release card and lists. It can be searched for too.',
  },
  'album.barcode': {
    text: 'The first edition’s JAN or EAN barcode, digits only. With several editions, enter each one under “Editions”.',
    examples: ['4988003123456'],
    where: 'Not shown on the page. Used for search and for the duplicate check when creating an album.',
  },
  'album.categories': {
    text: 'Where the music comes from. You can pick several. Leave it empty for an artist’s own original album. Once an entry is linked, suggestions appear here.',
    where: 'The tags above the title on the album page. The album list can be filtered by category too.',
  },
  'album.description': {
    text: 'Background and notes about this album, such as how the project came about or what it collects. Shown as plain text: line breaks and spaces stay as typed, and web addresses become links.',
    where: 'The “Description” card on the album page.',
  },
  'album.slug': {
    text: 'Optional. Lowercase letters, digits and hyphens only.',
    examples: ['my-album-2024'],
    where: 'Album page addresses use the numeric id for now, so this isn’t shown anywhere yet.',
  },
  'album.is_adult': {
    text: 'Turn this on for adult albums.',
    where: 'The album page shows as usual, and search engines are told it’s adult content.',
  },

  // ── Discs & tracks
  'disc': {
    rows: [
      ['Format', 'What the disc is. HQCD, SHM-CD and the like all count as CD.'],
      ['Disc title', 'Only if the disc has a printed title, e.g. “DISC 2 Instrumental”.'],
    ],
    where: 'The title bar of each disc in the tracklist. An edition’s format (such as CD+BD) is worked out from this too.',
    mock: { page: 'track', mark: 'disc_format' },
  },
  'track.number': {
    text: 'Its position on the disc, starting from 1. Each disc counts separately, and numbers can’t repeat on a disc.',
    where: 'The start of each row in the tracklist.',
    mock: { page: 'track', mark: 'number' },
  },
  'track.title': {
    text: 'Enter it in the original language, as printed on the release. Press Enter in a title to go to the next track. Titles in other languages go in “Album and track title translations”.',
    dont: ['When a track is missing, don’t rename the tracks after it to the next title one by one: add it with “Insert track”'],
    where: 'The tracklist and the track page.',
    mock: { page: 'track', mark: 'title' },
  },
  'track.duration': {
    text: 'Whole seconds only. Cut off any fraction of a second instead of rounding: 3:58.90 is entered as 3:58.',
    rows: [
      ['3:45', '3 minutes 45 seconds'],
      ['1:02:03', 'Over an hour'],
      ['345', 'Digits only, read as 3:45'],
    ],
    where: 'The right side of each row in the tracklist. Disc and album total lengths are added up from it.',
    mock: { page: 'track', mark: 'duration' },
  },
  'track.instrumental': {
    text: 'Tick this for tracks with no vocals, such as backing tracks and BGM.',
    where: 'Marked “Instrumental” in the tracklist, and the track has no lyrics button.',
    mock: { page: 'track', mark: 'instrumental' },
  },
  'track.number_label': {
    text: 'Only when the printed number differs from the track number, such as sides A and B on vinyl.',
    examples: ['A1', 'B2'],
    where: 'The tracklist and the track page show this number instead of the track number.',
    mock: { page: 'track', mark: 'number' },
  },
  'track.isrc': {
    text: 'International Standard Recording Code: 12 characters, no hyphens. Only if you know it.',
    examples: ['JPXX01234567'],
    where: 'The tracklist’s Full view and the track page.',
  },
  'track.move': {
    text: 'With several discs, moves this track to another disc.',
  },
  'track.originals': {
    text: 'The pieces this track arranges, covers, remixes or uses in a medley. A medley can have several.',
    rows: [
      ['In the catalog', 'Search for the track and pick it.'],
      ['Not in the catalog', 'Use the text you typed, e.g. “亡き王女の為のセプテット（東方紅魔郷）”.'],
    ],
    where: 'The tracklist and the track page. When you pick a track from the catalog, the original’s track page lists this arrangement too.',
    mock: { page: 'track', mark: 'original' },
  },
  'track.attributes': {
    text: 'Extra details defined by admins, such as BPM. Pick a field, then fill it in as its hint says.',
    where: 'The tracklist’s Full view and the track page.',
  },

  // ── Credits
  'person.credited_as': {
    text: 'Only when the printed name differs from the artist’s name. Leave it empty if they match.',
    rows: [
      ['Yuki Kajiura', 'The catalog has 梶浦由記: pick 梶浦由記 and enter Yuki Kajiura here.'],
      ['リコ(CV:富田美憂)', 'Pick the voice actor 富田美憂 and enter the name here as printed.'],
    ],
    where: 'The page shows this name, and the link still goes to the artist.',
    mock: { page: 'track', mark: 'credit' },
  },
  'person.detail': {
    text: 'A note for readers, in any words. A job title printed on the release goes under Specific role, not here.',
    examples: ['5-string', 'Limited edition only'],
    where: 'Behind the i icon by the name, on hover or tap.',
    mock: { page: 'track', mark: 'detail' },
  },
  'person.role_label': {
    text: 'For when the printed credit is more specific than the role dictionary. Pick the closest role and enter the credit here as printed.',
    rows: [
      ['Logo Design', 'Set the role to “Designer”.'],
      ['Flute', 'If the instrument has no role of its own, set the role to “Performer”.'],
      ['Crossfade Video', 'If no role in the dictionary fits, set the role to “Other”.'],
    ],
    where: 'The page shows this text instead of the role name, as written in every language.',
    mock: { page: 'track', mark: 'role_label' },
  },
  'person.join_phrase': {
    text: 'Fill it in when a word like meets or vs is printed between two artists and you want to keep it. Both stay artists; the page just joins them in one tag.',
    dont: ['Not for artists simply listed side by side: they show apart', 'Not for feat.: give the later name the role Featuring'],
    where: 'The artist line in the tracklist and on the track page. Not in the credits list or on artist pages.',
  },
  'person.parent': {
    text: 'Who on the same track this Featuring credit goes with. The default is the person listed just before.',
    rows: [
      ['Gardens feat. moon jelly', 'For moon jelly, set the role to Featuring and pick Gardens here.'],
      ['Xeno feat. eili', 'For eili, set the role to Featuring and pick Xeno here.'],
    ],
    where: 'The two names show joined together in the tracklist.',
  },
  'person.link_artist': {
    text: 'Only the name is recorded so far. If this person is in the catalog, search for them and pick them, and the name will open their artist page.',
  },
  'artist.type': {
    text: 'What kind of artist this is. You only choose it when creating someone who isn’t in the catalog, and you can’t submit until it’s chosen.',
    examples: ['Person', 'Group', 'Circle'],
    where: 'The artist page and the artist list’s filter.',
  },

  // ── Editions
  'edition.name': {
    text: 'What the release or the shop calls it. Optional when there’s only one edition.',
    examples: ['初回限定盤', '通常盤', '配信版'],
    where: 'The “Release” card on the album page. If it’s empty, the first edition shows its type (such as “Regular edition”) and the others show Release #id.',
    mock: { page: 'edition', mark: 'name' },
  },
  'edition.type': {
    text: 'Regular or limited. A limited edition can also have Limited by and Limited name filled in.',
    where: 'The edition type column in the “Release” card, showing “Regular edition” or “Limited edition”.',
    mock: { page: 'edition', mark: 'type' },
  },
  'edition.medium': {
    text: 'Physical or digital. If a digital release has the same content as the CD, tick Disc 1 in the same way and just set Medium to Digital.',
    where: 'The medium column in the “Release” card, showing “Physical” or “Digital”.',
    mock: { page: 'edition', mark: 'medium' },
  },
  'edition.limited_rule': {
    text: 'How this limited edition is limited: First press, Limited quantity, Limited period, Shop exclusive, Event exclusive or Region exclusive.',
    where: 'The tag under the edition name in the “Release” card, e.g. “First press”.',
    mock: { page: 'edition', mark: 'limited' },
  },
  'edition.limited_name': {
    text: 'The limited edition’s own name, such as which shop it’s exclusive to.',
    examples: ['Animate exclusive'],
    where: 'The “Release” card, under the edition name.',
  },
  'edition.catalog_number': {
    text: 'This edition’s catalog number. The format is tidied up when you leave the field.',
    rows: [
      ['KICA-1234', 'One disc'],
      ['KICA-1234~5', 'Several discs with consecutive numbers'],
      ['ABC-1 / ABC-3', 'Non-consecutive numbers, separated by /'],
    ],
    where: 'The “Release” card, under the edition name. The topmost edition with a catalog number also shows it under the title on the album page and in lists.',
    mock: { page: 'edition', mark: 'catalog' },
  },
  'edition.barcode': {
    text: 'This edition’s JAN or EAN barcode, digits only.',
    examples: ['4988003123456'],
    where: 'Not shown on the page. Used for search and for the duplicate check when creating an album.',
  },
  'edition.release_date': {
    text: 'Only when it differs from the album’s release date, such as a reissue or a later digital release. Write it the same way as the album’s date, in year-month-day order.',
    examples: ['2026-10-25', '2026-10', '2026'],
    where: 'The tag under the edition name in the “Release” card.',
    mock: { page: 'edition', mark: 'date' },
  },
  'edition.region': {
    text: 'The region this edition is released in.',
    where: 'The tag under the edition name in the “Release” card, showing a flag and the English region name.',
    mock: { page: 'edition', mark: 'region' },
  },
  'edition.discs': {
    text: 'Tick the discs in this edition, and its format (such as CD+BD) is worked out automatically. Every regular disc must be ticked in at least one edition.',
    dont: ['Bonus discs aren’t part of any edition and can’t be ticked.'],
    where: 'The tags under the edition name in the “Release” card: physical editions show a format such as CD+BD, plus Disc 1–2 when there’s more than one disc.',
    mock: { page: 'edition', mark: 'discs' },
  },
  'edition.hires': {
    text: 'Turn this on for high-resolution audio.',
    where: 'The Hi-Res tag under the edition name in the “Release” card.',
    mock: { page: 'edition', mark: 'hires' },
  },
  'edition.available': {
    text: 'Turn this off for editions no longer on sale.',
    where: 'When it’s off, the edition is marked “Out of print” under its name in the “Release” card.',
    mock: { page: 'edition', mark: 'sold_out' },
  },
  'edition.prices': {
    text: 'An edition can have several prices. Click a kind below to add one: List price, Event price, Shop price or Other price.',
    rows: [
      ['Amount', 'Digits only, e.g. 3300'],
      ['Currency', 'Three-letter code, e.g. JPY, CNY or USD'],
      ['Tax', 'Whether the printed price includes tax; if you don’t know, leave it on Tax not stated'],
      ['Note', 'Where it sells at this price, e.g. C107 or メロンブックス'],
    ],
    where: 'The price column in the “Release” card. The first price shows in the row, and with several you can open the full list. If there are none, it shows “No price yet”.',
    mock: { page: 'edition', mark: 'price' },
  },
  'edition.note': {
    text: 'What sets this edition apart from the others. It can run to several lines.',
    examples: ['2024 repress with a different cover'],
    where: 'The “Release” card, on its own full-width line under this edition.',
    mock: { page: 'edition', mark: 'note' },
  },

  // ── Bonuses
  'bonus.name': {
    text: 'The bonus’s name, as the shop or official source writes it.',
    examples: ['とらのあな特典 B2タペストリー'],
    where: 'The bonus table in the “Release & bonuses” card on the album page.',
  },
  'bonus.type': {
    text: 'What the bonus is: Bonus track, Bonus disc, Booklet, Photo, Goods, Digital content, Serial code, Event entry, Signed item or Other.',
    where: 'The type column of the bonus row.',
  },
  'bonus.shop': {
    text: 'The shop giving this bonus.',
    examples: ['Animate', 'とらのあな', 'メロンブックス'],
    where: 'The tag under the bonus name.',
  },
  'bonus.availability': {
    text: 'How to get it: First press, Limited quantity, Limited period, Shop exclusive, Event exclusive or Region exclusive.',
    where: 'The tag under the bonus name.',
  },
  'bonus.event': {
    text: 'For a bonus given out at an event, search for that event and pick it.',
    examples: ['M3-2026 Autumn'],
    where: 'The tag under the bonus name, which opens all albums from this event.',
  },
  'bonus.is_digital': {
    text: 'Tick this for bonuses that come as a download or a serial code.',
    where: 'The DL tag under the bonus name.',
  },
  'bonus.editions': {
    text: 'If only certain editions come with it, tick those. If every edition does, tick none.',
    where: 'The tags under the bonus name. With none ticked, no tag shows, which means every edition has it.',
  },
  'bonus.discs': {
    text: 'When the bonus is a CD, create a bonus disc here or turn an existing disc into one. Enter a new disc’s tracks under “Discs & tracks”, where it has a pink “Bonus” tag.',
    where: 'The Disc tag under the bonus name. Click it to jump to that disc in the tracklist.',
  },
  'bonus.description': {
    text: 'What the bonus is like: its size, contents and tracks.',
    examples: ['272mm×242mm、OPP 袋入り'],
    where: 'Its own full-width line under the bonus.',
  },
  'bonus.note': {
    text: 'How to qualify for it.',
    examples: ['購入者全員', '抽選'],
    where: 'Its own line under the bonus, in small text below the description.',
  },

  // ── Images
  'image.banner': {
    text: 'The strip across the top of the album page. Optional. About 4:1 is best, with what matters in the middle; anything extra is cropped around the centre.',
    where: 'The top of the album page. Without a banner, a blurred cover is used instead.',
  },
  'image.gallery': {
    text: 'Pictures of the physical release: front, back, booklet, disc and so on. Check each one after uploading:',
    rows: [
      ['Kind', 'Guessed from the file name. Change it here if it’s wrong.'],
      ['Label', 'Where it is, e.g. “p. 01-02” for booklet pages or “Disc 2” for a disc.'],
      ['Belongs to', 'The whole album, or just one edition, bonus or disc.'],
      ['Caption', 'Optional text about the image.'],
    ],
    where: 'The Images card on the album page and the image viewer.',
  },

  // ── Links & relations
  'entry.entry': {
    text: 'The game, anime or other work this album belongs to. Search for it and pick it. If it isn’t in the catalog, create the entry first.',
    where: 'Linked entries in the “Description” card on the album page. The entry page lists this album too.',
  },
  'entry.relation': {
    text: 'How this album relates to the work, such as Soundtrack, Theme song or Character song.',
    where: 'Small text after the linked entry on the album page.',
  },
  'entry.note': {
    text: 'Only when it needs explaining, such as which season this theme song was used in.',
    where: 'Not shown on the page for now. It stays in the data only.',
  },
  'link.url': {
    text: 'Paste the full address, starting with http:// or https://. The site is recognised automatically.',
    examples: ['https://example.bandcamp.com/album/atlas'],
    where: 'The page’s Links card. Streaming links show separately as buttons.',
  },
  'link.provider': {
    text: 'Which site this link belongs to. It’s picked from the address, and you can change it if it’s wrong. Leave it empty for sites not on the list.',
    where: 'The site name and colour on the Links card.',
  },
  'link.label': {
    text: 'Optional. Tells several links to one site apart.',
    examples: ['Official MV', 'Crossfade'],
    where: 'After the site’s name, e.g. “YouTube · Official MV”.',
  },
  'attribute.key': {
    text: 'What to add. Fields are defined by admins. Once you pick one, its description appears below.',
  },
  'attribute.value': {
    text: 'Fill it in as the field’s description above says. If you’re not sure, leave it empty.',
    where: 'In the album, track or image details, shown as “Field name value”.',
  },

  // ── Album and track title translations
  'translate.names': {
    text: 'The original name is on the left. Enter the name in this language on the right, and leave any row you don’t know empty.',
    rows: [
      ['Official name', 'Printed on the release, the official site or an official store'],
      ['Translation', 'Translated by you or the community'],
      ['Reading', 'The original name in romaji or kana'],
    ],
    dont: ['Don’t enter a machine translation as an official name.'],
    where: 'When the interface is in this language, the album page shows the official name first, then the translation. Lists don’t show translated names. Every name can be searched for.',
  },

  // ── Review & submit
  'submit.summary': {
    text: 'What you changed and why. Reviewers read this first. For a new album, a line on the source or background is fine too.',
    examples: ['Added Disc 2’s track durations'],
    where: 'The revision history and the review page.',
  },
  'submit.sources': {
    text: 'One link or reference per line, so reviewers can check faster.',
    examples: ['Booklet', 'https://vgmdb.net/album/1234'],
    where: 'The revision history and the review page.',
  },
  'submit.server_draft': {
    text: 'Drafts autosave in this browser only. Save to CDCat stores this one in your account, so it opens on another device too; later changes go there when you save to CDCat again.',
    rows: [
      ['Who sees it', 'Only you'],
      ['How many', 'Up to 10, each at most 2 MB'],
      ['Kept', 'Deleted 30 days after its last save, with the images only this draft uses'],
      ['Once submitted', 'Deleted'],
    ],
    where: 'The drafts at the top of My Revisions; an AI using the drafts MCP can read and write it too.',
  },
}

export default help
