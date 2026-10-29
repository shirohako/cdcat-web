import { describe, expect, it } from 'vitest'
import { markdownContainers, markdownHeadings, renderMarkdown, renderMarkdownInline } from '../../app/utils/markdown'

describe('Heading anchors', () => {
  it('slugs headings in every script and numbers repeats', () => {
    const source = '# 東方 紅魔郷\n\n## 東方 紅魔郷\n\n### Liner Notes!\n\n## 노래'
    const html = renderMarkdown(source)
    expect(html).toContain('<h1 id="東方-紅魔郷">')
    expect(html).toContain('<h2 id="東方-紅魔郷-1">')
    expect(html).toContain('<h3 id="liner-notes">')
    expect(html).toContain('<h2 id="노래">')
  })

  it('lists the same anchors the renderer emits', () => {
    const source = '# Intro\n\n## Intro\n\n## **Bold** title\n\n## !!!'
    expect(markdownHeadings(source)).toEqual([
      { id: 'intro', text: 'Intro', level: 1, line: 0 },
      { id: 'intro-1', text: 'Intro', level: 2, line: 2 },
      { id: 'bold-title', text: 'Bold title', level: 2, line: 4 },
    ])
    const html = renderMarkdown(source)
    for (const { id } of markdownHeadings(source)) expect(html).toContain(`id="${id}"`)
    expect(html).toContain('<h2>!!!</h2>')
  })
})

describe('Markdown renderer', () => {
  it('renders standard Markdown and task lists', () => {
    const html = renderMarkdown('## Guide\n\n- [x] Done\n- [ ] Next')
    expect(html).toContain('<h2 id="guide">Guide</h2>')
    expect(html).toContain('task-list-item')
    expect(html).toContain('type="checkbox"')
  })

  it.each(markdownContainers)('renders the $name container', ({ name }) => {
    const html = renderMarkdown(`::: ${name} Custom title\n**Body**\n:::`)
    expect(html).toContain(`markdown-container-${name === 'info' || name === 'tip' || name === 'warning' || name === 'danger' ? 'callout' : name}`)
    expect(html).toContain('Custom title')
    expect(html).toContain('<strong>Body</strong>')
  })

  it('renders adjacent and nested containers without leaking markers', () => {
    const html = renderMarkdown(':::: details Outer\n::: warning Inner\nText\n:::\n::::\n\n::: tip Next\nDone\n:::')
    expect(html).toContain('markdown-container-details')
    expect(html).toContain('markdown-container-callout')
    expect(html).not.toContain(':::')
  })

  it('renders every non-checklist container nested inside every other container', () => {
    const names = markdownContainers
      .map(({ name }) => name)
      .filter(name => name !== 'checklist')

    for (const outer of names) {
      for (const inner of names) {
        const html = renderMarkdown(`:::: ${outer} Outer-${outer}\n::: ${inner} Inner-${inner}\n**Nested body**\n:::\n::::`)
        expect(html.match(new RegExp(`Outer-${outer}`, 'g'))).toHaveLength(1)
        expect(html.match(new RegExp(`Inner-${inner}`, 'g'))).toHaveLength(1)
        expect(html.match(/Nested body/g)).toHaveLength(1)
        expect(html).toContain('<strong>Nested body</strong>')
        expect(html).not.toContain(':::')
      }
    }
  })

  it('escapes container titles and raw HTML', () => {
    const html = renderMarkdown('::: details <img src=x onerror=alert(1)>\n<script>alert(1)</script>\n:::')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
  })

  it('does not create executable links', () => {
    const html = renderMarkdown('[unsafe](javascript:alert(1))')
    expect(html).not.toContain('href=')
    expect(html).not.toContain('<a')
  })

  it('opens other sites in a new tab and keeps the site and its anchors in this one', () => {
    expect(renderMarkdown('[out](https://example.org)')).toContain('target="_blank"')
    expect(renderMarkdown('[page](/albums/1)')).toBe('<p><a href="/albums/1">page</a></p>\n')
    expect(renderMarkdown('[section](#vinyl)')).toBe('<p><a href="#vinyl">section</a></p>\n')
  })

  it('renders one line inline, with the same escaping', () => {
    expect(renderMarkdownInline('Use `per_page`, **not** <b>size</b>')).toBe('Use <code>per_page</code>, <strong>not</strong> &lt;b&gt;size&lt;/b&gt;')
    expect(renderMarkdownInline('[see](#object-album-simple)')).toBe('<a href="#object-album-simple">see</a>')
  })

  it('renders highlighting, allow-listed colors and text sizes', () => {
    const html = renderMarkdown('==Marked== [Red **text**]{color=red} [Large]{size=large} [Underlined]{underline=blue}')
    expect(html).toContain('<mark>Marked</mark>')
    expect(html).toContain('markdown-text-color markdown-color-red')
    expect(html).toContain('Red <strong>text</strong>')
    expect(html).toContain('markdown-text-size text-lg')
    expect(html).toContain('markdown-text-underline markdown-underline-blue')
  })

  it('combines allow-listed Pandoc span attributes', () => {
    const html = renderMarkdown('[Important]{color=purple size=xlarge underline=green}')
    expect(html).toContain('markdown-text-color markdown-color-purple')
    expect(html).toContain('markdown-text-size text-xl')
    expect(html).toContain('markdown-text-underline markdown-underline-green')
  })

  it('nests Pandoc spans when the styled ranges differ', () => {
    const html = renderMarkdown('[Outer [inner]{color=red}]{size=large}')
    expect(html).toContain('<span class="markdown-text-size text-lg">Outer <span class="markdown-text-color markdown-color-red">inner</span></span>')
  })

  it('cross-nests inline spoilers, styled spans and emphasis without duplication', () => {
    const html = renderMarkdown('[Outer ||hidden **bold**||]{color=red}\n\n||[styled *text*]{color=blue}||')

    expect(html.match(/Outer/g)).toHaveLength(1)
    expect(html.match(/hidden/g)).toHaveLength(1)
    expect(html.match(/bold/g)).toHaveLength(1)
    expect(html.match(/styled/g)).toHaveLength(1)
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>text</em>')
    expect(html.match(/class="markdown-inline-spoiler"/g)).toHaveLength(2)
    expect(html).toContain('markdown-text-color markdown-color-red')
    expect(html).toContain('markdown-text-color markdown-color-blue')
  })

  it('renders inline spoilers with nested Markdown and leaves unclosed syntax inert', () => {
    const html = renderMarkdown('Before ||hidden **text**|| after\n\n||unclosed')
    expect(html).toContain('class="markdown-inline-spoiler"')
    expect(html).toContain('<strong>text</strong>')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('||unclosed')
  })

  it('renders a titled checklist with initial progress', () => {
    const html = renderMarkdown('::: checklist Preparation\n- [x] Done\n- [ ] Pending\n:::')
    expect(html).toContain('markdown-container-checklist')
    expect(html).toContain('<strong>Preparation</strong>')
    expect(html).toContain('markdown-checklist-progress-value">1 / 2')
  })

  it('does not duplicate nested Markdown in task-list labels', () => {
    const source = [
      '::: checklist 必殺技',
      '- [ ] ****仁華\\*\\*** オシュト + ルクオン',
      ':::',
    ].join('\n')
    const html = renderMarkdown(source)

    expect(html.match(/仁華/g)).toHaveLength(1)
    expect(html).toContain('<strong>仁華**</strong>')
    expect(html).not.toContain('****仁華\\*\\***')
  })

  it('preserves supported inline nesting in task-list labels', () => {
    const source = [
      '- [ ] **Bold** and *italic* and ~~strike~~ and ==mark==',
      '- [ ] [Link](https://example.com) and `code` and ||spoiler **nested**||',
      '- [ ] [Styled **nested**]{color=red size=large}',
      '- [ ] ![Logo](/logo.png){width=320 height=180}',
    ].join('\n')
    const html = renderMarkdown(source)

    expect(html).toContain('<strong>Bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<s>strike</s>')
    expect(html).toContain('<mark>mark</mark>')
    expect(html).toContain('<a href="https://example.com"')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('class="markdown-inline-spoiler"')
    expect(html).toContain('<strong>nested</strong>')
    expect(html).toContain('markdown-text-color markdown-color-red')
    expect(html).toContain('markdown-text-size text-lg')
    expect(html).toContain('class="markdown-sized-image"')
    expect(html).toContain('width="320"')
    expect(html).toContain('height="180"')
    expect(html.match(/>Bold</g)).toHaveLength(1)
    expect(html.match(/>Link</g)).toHaveLength(1)
    expect(html.match(/>Styled /g)).toHaveLength(1)
  })

  it('escapes raw HTML nested in a task-list label', () => {
    const html = renderMarkdown('- [ ] <img src=x onerror=alert(1)> **safe**')

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('<strong>safe</strong>')
  })

  it('applies safe Pandoc image dimensions and preserves unsafe attributes as text', () => {
    const html = renderMarkdown('![Logo](/logo.png){width=320 height=180}\n\n![Bad](/logo.png){width=99999 onclick=x}')
    expect(html).toContain('class="markdown-sized-image"')
    expect(html).toContain('width="320"')
    expect(html).toContain('height="180"')
    expect(html).toContain('{width=99999 onclick=x}')
    expect(html).not.toMatch(/<img[^>]+onclick=/)
  })

  it('keeps unknown inline style values inert', () => {
    const html = renderMarkdown('[Text]{color=javascript} [Huge]{size=999px} [Bad]{onclick=alert}')
    expect(html).not.toContain('<span')
    expect(html).not.toContain('style=')
    expect(html).toContain('{color=javascript}')
  })

  it('leaves unknown container syntax inert', () => {
    const html = renderMarkdown('::: unknown\nText\n:::')
    expect(html).not.toContain('markdown-container')
    expect(html).toContain('unknown')
  })

  it('labels table cells with their column heading, escaped', () => {
    const html = renderMarkdown('| **Item** | <b>Use & keep</b> | |\n|---|---|---|\n| A | B | C |')
    expect(html).toContain('<td data-label="Item">A</td>')
    expect(html).toContain('<td data-label="&lt;b&gt;Use &amp; keep&lt;/b&gt;">B</td>')
    expect(html).toContain('<td>C</td>')
  })
})
