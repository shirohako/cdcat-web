// https://nuxt.com/docs/api/configuration/nuxt-config
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
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || ''
    }
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
  },

  // The Markdown editor keeps its upstream file names (MarkdownEditor,
  // RichContent, MarkdownGuide), so its folder is registered without a prefix.
  components: [
    { path: '~/components/markdown', pathPrefix: false },
    '~/components',
  ],

  icon: {
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
      }
    ],
    defaultLocale: 'en',
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        'countries-list',
        '@lucide/vue',
        'lucide',
        'markdown-it',
        'markdown-it-container',
        'markdown-it-mark',
        'markdown-it-task-lists',
      ],
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/markdown.css'],
})
