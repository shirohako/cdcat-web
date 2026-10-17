import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { markdownHeadings, renderMarkdown } from '../../app/utils/markdown'

// The snapshot was recorded when the renderer moved in from @psray/markdown-editor
// 0.2.1 and matched that package byte for byte; since the discussion work external
// links carry `nofollow ugc` and images load lazily without a referrer. A diff here
// is a rendering change.
const fixture = readFileSync(new URL('./fixtures/all-syntax.md', import.meta.url), 'utf8')
// markdown-it-task-lists draws a random id for every checkbox on each render.
const stable = (html: string) => html.replace(/task-item-\d+/g, 'task-item-N')

describe('all-syntax fixture', () => {
  it('renders unchanged', () => {
    expect(stable(renderMarkdown(fixture))).toMatchSnapshot()
  })

  it('lists unchanged headings', () => {
    expect(markdownHeadings(fixture)).toMatchSnapshot()
  })
})
