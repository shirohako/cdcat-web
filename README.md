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
- `NUXT_PUBLIC_API_BASE_URL` (backend API base URL)
- `PORT` (server port for production preview/server)

## Development

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3200`.
