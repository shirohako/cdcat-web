// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Third-party code, vendored with its licence (tools/teardown/vendor/LICENSE).
  { ignores: ['tools/teardown/vendor/**'] },
)
