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
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
      // Search engines may index the site only where NUXT_PUBLIC_INDEXABLE=true (production); see docs/seo in the API repo.
      indexable: false,
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
    // Password reset moved beside login and register, under the record stage.
    '/forgot-password': { redirect: { to: '/auth/forgot-password', statusCode: 301 } },
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
  // The body faces (font stacks in main.css). Only @font-face rules: a slice downloads when a page uses its characters.
  css: [
    '@fontsource-variable/noto-sans-sc/wght.css',
    '@fontsource-variable/noto-sans-tc/wght.css',
    '@fontsource-variable/noto-sans-jp/wght.css',
    '~/assets/css/main.css',
    '~/assets/css/markdown.css',
  ],
})
