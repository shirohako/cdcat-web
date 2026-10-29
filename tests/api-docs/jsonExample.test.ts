import { describe, expect, it } from 'vitest'
import { API_DOCS_STRUCTURE } from '../../app/api-docs/structure'
import { jsonExampleLines, jsonExampleText, type JsonExample, type JsonLine } from '../../app/utils/jsonExample'

/** The lines as the code block shows them, with two spaces per level. */
const render = (lines: JsonLine[]) => lines.map(line => '  '.repeat(line.depth) + line.tokens.map(token => token.type === 'more'
  ? `…${typeof token.more === 'number' ? ` +${token.more}` : typeof token.more === 'string' ? ` ${token.more}` : ''}`
  : token.text).join('')).join('\n')

describe('jsonExampleLines', () => {
  it('escapes strings the JSON way', () => {
    expect(render(jsonExampleLines({ text: 'say "hi" \\ </script> 🎵' }))).toBe('{ "text": "say \\"hi\\" \\\\ </script> 🎵" }')
  })

  it('keeps short flat values on one line and breaks the rest', () => {
    expect(render(jsonExampleLines({ a: [], b: {} }))).toBe('{\n  "a": [],\n  "b": {}\n}')
    expect(render(jsonExampleLines({ id: 1, tags: ['a', 'b'] }))).toBe('{ "id": 1, "tags": ["a", "b"] }')
    const long = { title: 'A long album title that keeps going', catalog_number: 'STNT-0012' }
    expect(render(jsonExampleLines(long))).toBe('{\n  "title": "A long album title that keeps going",\n  "catalog_number": "STNT-0012"\n}')
  })

  it('types every token', () => {
    const tokens = jsonExampleLines({ n: 1, s: 'x', b: true, z: null }).flatMap(line => line.tokens)
    expect(tokens.filter(token => token.type !== 'punct').map(token => token.type)).toEqual(['key', 'number', 'key', 'string', 'key', 'literal', 'key', 'literal'])
  })

  it('marks left-out items and fields, keeping the comma before them', () => {
    const value: JsonExample = { albums: [{ id: 1 }, { $more: 17 }], album: { $more: 'AlbumSimple' }, rest: [{ $more: true }], id: 2, $more: 'Album' }
    expect(render(jsonExampleLines(value))).toBe([
      '{',
      '  "albums": [',
      '    { "id": 1 },',
      '    … +17',
      '  ],',
      '  "album": { … AlbumSimple },',
      '  "rest": [',
      '    …',
      '  ],',
      '  "id": 2,',
      '  … Album',
      '}',
    ].join('\n'))
  })
})

describe('jsonExampleText', () => {
  it('copies valid JSON without the markers', () => {
    const value: JsonExample = { albums: [{ id: 1 }, { $more: 17 }], album: { $more: 'AlbumSimple' }, id: 2, $more: true }
    expect(JSON.parse(jsonExampleText(value))).toEqual({ albums: [{ id: 1 }], album: {}, id: 2 })
  })

  it('gives JSON for every example in the reference', () => {
    for (const section of API_DOCS_STRUCTURE.sections) {
      for (const item of section.items) {
        if (item.kind !== 'endpoint') continue
        expect(() => JSON.parse(jsonExampleText(item.example.body)), item.path).not.toThrow()
        expect(jsonExampleText(item.example.body), item.path).not.toContain('$more')
      }
    }
  })
})
