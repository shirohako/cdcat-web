// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
    }
  },

  modules: [
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
    strategy: 'no_prefix',
    locales: [
      {
        code: 'zh-Hans',
        language: 'zh-Hans',
        name: '简体中文',
        file: 'zh-Hans.json',
      },
      {
        code: 'zh-Hant',
        language: 'zh-Hant',
        name: '繁體中文',
        file: 'zh-Hant.json',
      },
      {
        code: 'en',
        language: 'en',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'ja',
        language: 'ja',
        name: '日本語',
        file: 'ja.json',
      }
    ],
    defaultLocale: 'en',
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  css: ['./app/assets/css/main.css'],
})