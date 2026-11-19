import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// vue-i18n compiles a message the first time a page asks for it, so a slip in its syntax passes the build and then
// fails the page (a 500 on the server). These catch the two easy ones: a bare `@`, which starts a linked message
// (write `{'@'}`), and a brace without its partner.
const dirs = ['i18n/locales', 'i18n/locales/markdown']

function* strings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value]
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) yield* strings(child, path ? `${path}.${key}` : key)
}

/** The message without its literals (`{'…'}`) and placeholders (`{name}`). */
const withoutBraces = (message: string) => message.replace(/\{'[^']*'\}/g, '').replace(/\{\s*[\w.]+\s*\}/g, '')

for (const dir of dirs) {
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
    describe(`${dir}/${file}`, () => {
      const messages = [...strings(JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')), '')]

      it('writes @ as a literal unless it links a message', () => {
        const bare = messages.filter(([, message]) => /@(?![.:])/.test(withoutBraces(message))).map(([path]) => path)
        expect(bare).toEqual([])
      })

      it('has no stray braces', () => {
        const stray = messages.filter(([, message]) => /[{}]/.test(withoutBraces(message))).map(([path]) => path)
        expect(stray).toEqual([])
      })
    })
  }
}
