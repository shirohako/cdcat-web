# CDCAT Web

Frontend for CDCAT — a music database covering doujin releases, game soundtracks, Vocaloid, covers, Touhou, and anime-related music.

## Tech Stack

- Nuxt 4 + Vue 3
- Tailwind CSS + daisyUI
- `@nuxtjs/i18n` for localization

## Requirements

- Node.js (LTS recommended)
- pnpm (recommended; this repo is configured for pnpm)

## Environment Variables

This project uses Nuxt runtime config mapped from environment variables.

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` as needed:

- `NUXT_PUBLIC_BASE_URL` (your site URL, used by SEO/i18n)
- `NUXT_PUBLIC_API_BASE_URL` (backend API base URL; development: `https://api.dev.cdcat.net`)
- `PORT` (server port for production preview/server)

## Development

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3210`.

## Page data and loading states

Pages render as soon as they are navigated to; their data arrives afterwards. The server still waits for the data, so server-rendered HTML is complete.

- Fetch a page's main data with `usePageAPI(url, { query })` or `usePageData(key, fetcher)` (`app/composables/usePageData.ts`). Keep the `await`: it only waits on the server, so code after it can still read the data there. The key must contain every request parameter.
- Public pages keep the data of a visit for ten minutes (`app/utils/pageCache.ts`): coming back shows it at once and refreshes it in the background. Pass `cache: false` for data about the viewer (notifications, drafts, revisions…).
- Templates go in this order: content when there is data, the error when `status === 'error'`, otherwise the skeleton. Keep one static root element per page; page transitions attach to it.
- Skeletons are built from `.skeleton` blocks inside `SkeletonStatus` (`app/components/skeleton/`), or `CollectionLoadingSkeleton` for lists. The skeleton that stands in for a page's main data passes `page`, so the scroll restoration in `app/router.options.ts` waits for it.
- Content that replaces a skeleton gets `revealClass`. A list also gets `:key="revealKey"` and is dimmed and `inert` while `refetching`; a failed refetch keeps the old results under `CommonLoadError`.
- After the reader changes something the page data holds (a favourite, a tracking status), update it with `mutate` so the cached copy stays right.
- `v-img-fade` fades in an image that loads after the page is on screen.
