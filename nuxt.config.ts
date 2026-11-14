// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Pages render before their data (see composables/usePageData.ts), so a switch can animate straight away.
  // The admin console and reduced motion turn these off in middleware/transitions.global.ts.
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  runtimeConfig: {
    // IndexNow (server/tasks/indexnow.ts): set NUXT_INDEXNOW_KEY in production; empty turns the task off.
    indexnowKey: '',
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
      // Search engines may index the site only where NUXT_PUBLIC_INDEXABLE=true (production); see docs/seo in the API repo.
      indexable: false,
      // The `content` of Naver Search Advisor's ownership tag; empty leaves the tag out.
      naverSiteVerification: '',
    }
  },

  // Hourly, a few minutes past: tell IndexNow which pages changed (server/tasks/indexnow.ts).
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { '7 * * * *': ['indexnow'] },
  },

  modules: [
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  routeRules: {
    // The writing page moved when articles gained review; keep old links working.
    '/articles/create': { redirect: { to: '/articles/new', statusCode: 301 } },
    // Password reset moved beside login and register, under the record stage.
    '/forgot-password': { redirect: { to: '/auth/forgot-password', statusCode: 301 } },
    // /docs has one document so far; a temporary redirect, so it can become an index later.
    '/docs': { redirect: { to: '/docs/api', statusCode: 302 } },
    // Addresses from before sections were renamed (docs/seo in the API repo): the guides were under /help, franchises
    // were /series and event series were /events/series.
    '/help/design': { redirect: { to: '/docs/design', statusCode: 301 } },
    '/help/editor': { redirect: { to: '/docs/editor', statusCode: 301 } },
    '/help/markdown': { redirect: { to: '/docs/markdown', statusCode: 301 } },
    '/series': { redirect: { to: '/franchises', statusCode: 301 } },
    '/series/**': { redirect: { to: '/franchises/**', statusCode: 301 } },
    '/events/series/**': { redirect: { to: '/event-series/**', statusCode: 301 } },
  },

  // The component showcase (app/dev/UiShowcase.vue) lives outside app/pages and is routed only under `nuxt dev`,
  // so production builds have no /dev/ui at all.
  $development: {
    hooks: {
      'pages:extend'(pages) {
        pages.push({ name: 'dev-ui', path: '/dev/ui', file: fileURLToPath(new URL('./app/dev/UiShowcase.vue', import.meta.url)) })
      },
    },
  },

  // The Markdown editor keeps its upstream file names (MarkdownEditor,
  // RichContent, MarkdownGuide), so its folder is registered without a prefix.
  components: [
    { path: '~/components/markdown', pathPrefix: false },
    '~/components',
  ],

  icon: {
    // The icons' own CSS (width/height: 1em) goes in Tailwind's base layer. Unlayered, it beat every size-* class,
    // since unlayered rules win over layered ones, and every icon came out at the font size around it.
    cssLayer: 'base',
    customCollections: [
      {
        prefix: 'cdcat',
        dir: './app/assets/icons',
      },
    ],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
      icons: [
        'lucide:layout-dashboard',
        'lucide:disc-3',
        'lucide:mic-2',
        'lucide:calendar',
        'lucide:film',
        'lucide:library',
        'lucide:disc',
        'lucide:message-circle',
        'lucide:newspaper',
        'lucide:info',
        'lucide:menu',
        'lucide:panel-left-open',
        'lucide:panel-left-close',
        'lucide:search',
        'lucide:languages',
      ],
    },
  },

  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
    strategy: 'no_prefix',
    // Each locale also loads the Markdown editor's messages (`markdown.*`).
    locales: [
      {
        code: 'zh-Hans',
        language: 'zh-Hans',
        name: '简体中文',
        files: ['zh-Hans.json', 'markdown/zh-Hans.json'],
      },
      {
        code: 'zh-Hant',
        language: 'zh-Hant',
        name: '繁體中文',
        files: ['zh-Hant.json', 'markdown/zh-Hant.json'],
      },
      {
        code: 'en',
        language: 'en',
        name: 'English',
        files: ['en.json', 'markdown/en.json'],
      },
      {
        code: 'ja',
        language: 'ja',
        name: '日本語',
        files: ['ja.json', 'markdown/ja.json'],
      },
      {
        code: 'ko',
        language: 'ko',
        name: '한국어',
        files: ['ko.json', 'markdown/ko.json'],
      },
    ],
    defaultLocale: 'en',
  },

  // `/_nuxt/` is cached as immutable, so a file's name must change whenever its bytes do. The entry import map breaks
  // that: chunks keep their names while their preload lists name a new entry CSS, and returning browsers load the old
  // Tailwind on top of the new one. Remove once https://github.com/nuxt/nuxt/issues/36136 is fixed.
  experimental: {
    entryImportMap: false,
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    // The browser's bundle only. Left to itself the bundler gives every small module that two pages share a file of
    // its own: an album page asked for 131 scripts, 93 of them under a kilobyte. Three groups take most of those:
    //  - framework: Vue, the router, i18n and the other libraries every page runs on. They change only when a
    //    dependency is updated, so returning readers keep this file across releases.
    //  - ui: the Ui* components, which every page is built from.
    //  - icons: @lucide/vue, a few hundred bytes an icon. Grouped by the pages that use them, so a page fetches a few
    //    icon files rather than one per icon, and not the icons of pages it isn't.
    $client: {
      build: {
        rolldownOptions: {
          output: {
            codeSplitting: {
              groups: [
                { name: 'framework', test: /[\\/]node_modules[\\/](?:vue|@vue|vue-router|vue-i18n|@intlify|unhead|@unhead|ofetch|hookable|defu|destr|ufo|ohash|devalue)[\\/]/, priority: 30 },
                { name: 'icons', test: /[\\/]@lucide[\\/]vue[\\/]/, priority: 20, entriesAware: true, entriesAwareMergeThreshold: 4_000 },
                { name: 'ui', test: /[\\/]app[\\/]components[\\/]ui[\\/]/, priority: 10 },
              ],
            },
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        '@lucide/vue',
        'lucide',
        'linkify-it',
        'markdown-it',
        'markdown-it-container',
        'markdown-it-mark',
        'markdown-it-task-lists',
      ],
    },
  },
  // The body faces' @font-face rules (assets/css/fonts.css) are not in this list: they are a third of a megabyte and
  // would hold up the first paint, so useAppHead loads them as a stylesheet of their own, without blocking.
  css: [
    '~/assets/css/main.css',
    '~/assets/css/markdown.css',
  ],
})
