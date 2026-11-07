import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EDITOR_HELP, editorHelpIds } from '../../app/editorHelp'

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? files(path) : path.endsWith('.vue') ? [path] : []
})

const used = files('app/components/editor').flatMap(file => [...readFileSync(file, 'utf8').matchAll(/<EditorHelp id="([^"]+)"/g)].map(match => match[1]!))

describe('editor help', () => {
  it('has a text for every field that asks for one', () => {
    expect([...new Set(used)].filter(id => !editorHelpIds.includes(id))).toEqual([])
  })

  it('has no text that no field shows', () => {
    expect(editorHelpIds.filter(id => !used.includes(id))).toEqual([])
  })

  /** An entry's parts, how many rows and lines each has, and its drawing: what must not differ between languages. */
  const shape = (entry: (typeof EDITOR_HELP)[string][string]) => ({
    parts: Object.keys(entry),
    rows: entry.rows?.length,
    examples: entry.examples?.length,
    dont: entry.dont?.length,
    mock: entry.mock,
  })

  it.each(Object.keys(EDITOR_HELP).filter(locale => locale !== 'zh-Hans'))('has the same entries in %s', (locale) => {
    const help = EDITOR_HELP[locale]!
    expect(Object.keys(help)).toEqual(editorHelpIds)
    for (const id of editorHelpIds) expect(shape(help[id]!), id).toEqual(shape(EDITOR_HELP['zh-Hans']![id]!))
  })
})
