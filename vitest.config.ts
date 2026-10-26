import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests for the Markdown renderer, editing helpers, catalog editor utilities, the page data cache, the event venue helpers, the SEO helpers and the harvest draft's people. `#app` is the only
// Nuxt specifier they reach for; the stub stands in for it so they run as plain
// Node. The admin smoke tests under tests/admin use node:test and stay out.
export default defineConfig({
  resolve: {
    alias: {
      '#app': fileURLToPath(new URL('./tests/markdown/stubs/nuxt-app.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/markdown/**/*.test.ts', 'tests/catalog/**/*.test.ts', 'tests/page/**/*.test.ts', 'tests/event/**/*.test.ts', 'tests/seo/**/*.test.ts', 'tests/harvest/**/*.test.ts'],
  },
})
