import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { editorHelpIds } from '../../app/editorHelp'

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
})
