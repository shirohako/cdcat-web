import { describe, expect, it } from 'vitest'
import { renderMarkdown, type MarkdownEnv } from '../../app/utils/markdown'
import { markdownQuote, siteUrlToToken } from '../../app/utils/markdownEditor'

const env: MarkdownEnv = {
  references: {
    users: {
      alice: { id: 1, username: 'Alice', nickname: 'Alice <b>A</b>', avatar: null },
    },
    posts: {
      12: { id: 12, topic_id: 3, topic_title: 'T', floor: 5, parent_floor: null, user: { username: 'bob', nickname: 'Bob "B"' }, status: 'visible' },
      13: { id: 13, topic_id: 3, topic_title: 'T', floor: null, parent_floor: 5, user: { username: 'bob', nickname: null }, status: 'visible' },
      14: { id: 14, topic_id: 3, topic_title: 'T', floor: 6, parent_floor: null, user: null, status: 'deleted' },
    },
    works: {
      7: { type: 'work', id: 7, title: '<script>x</script> Album', image_url: 'https://img.example/a.jpg', date: '2024-12-30' },
      8: { type: 'work', id: 8, title: 'Plain', image_url: 'http://insecure.example/a.jpg' },
    },
    events: { 2: { type: 'event', id: 2, title: 'M3', event_series_id: 9 } },
    articles: { 4: { type: 'article', id: 4, title: 'Notes', slug: 'liner-notes' } },
  },
}

describe('Mentions', () => {
  it('links known users and escapes their names', () => {
    const html = renderMarkdown('Thanks @alice!', env)
    expect(html).toContain('<a class="markdown-mention" href="/profile/Alice" title="Alice &lt;b&gt;A&lt;/b&gt;">@alice</a>!')
  })

  it('leaves unknown users, e-mail addresses, URLs and link text alone', () => {
    expect(renderMarkdown('@nobody', env)).not.toContain('markdown-mention')
    expect(renderMarkdown('mail foo@alice.com', env)).not.toContain('markdown-mention')
    expect(renderMarkdown('https://x.example/@alice', env)).not.toContain('markdown-mention')
    expect(renderMarkdown('[@alice](https://example.com)', env)).not.toContain('markdown-mention')
    expect(renderMarkdown('`@alice`', env)).not.toContain('markdown-mention')
    expect(renderMarkdown('（@alice）', env)).toContain('markdown-mention')
  })

  it('renders mentions as text without references', () => {
    expect(renderMarkdown('Thanks @alice')).toBe('<p>Thanks @alice</p>\n')
  })
})

describe('Database tokens', () => {
  it('turns a token alone in a paragraph into a card and escapes the title', () => {
    const html = renderMarkdown('[[work:7]]', env)
    expect(html).toContain('<a class="markdown-ref-card markdown-ref-card-work" href="/works/7">')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt; Album')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<img src="https://img.example/a.jpg" alt="" loading="lazy" referrerpolicy="no-referrer">')
    expect(html).not.toContain('<p>')
  })

  it('keeps tokens inside sentences and list items inline', () => {
    expect(renderMarkdown('See [[work:8]] here', env)).toContain('<p>See <a class="markdown-ref markdown-ref-work" href="/works/8">')
    expect(renderMarkdown('- [[work:8]]\n- [[work:7]]', env)).not.toContain('markdown-ref-card')
  })

  it('drops non-https card images and links events to their series', () => {
    expect(renderMarkdown('[[work:8]]', env)).not.toContain('insecure.example')
    expect(renderMarkdown('[[event:2]]', env)).toContain('href="/events/series/9"')
    expect(renderMarkdown('[[article:4]]', env)).toContain('href="/articles/4/liner-notes"')
  })

  it('greys out tokens without a summary', () => {
    expect(renderMarkdown('Gone: [[song:99]]', env)).toContain('<span class="markdown-ref markdown-ref-missing">')
    expect(renderMarkdown('[[topic:5]]')).toContain('markdown-ref-missing')
    expect(renderMarkdown('[[nope:5]]', env)).toContain('[[nope:5]]')
  })
})

describe('Quotes', () => {
  it('names the author and floor and links to the post', () => {
    const html = renderMarkdown('::: quote post:12\nquoted **text**\n:::', env)
    expect(html).toContain('<blockquote class="markdown-quote" data-post="12">')
    expect(html).toContain('<a class="markdown-quote-source" href="/discussions/3?post=12"><strong>Bob &quot;B&quot;</strong> <span class="markdown-quote-floor">#5</span></a>')
    expect(html).toContain('<strong>text</strong>')
    expect(renderMarkdown('::: quote post:13\nx\n:::', env)).toContain('reply under #5')
  })

  it('says when the original is deleted or unavailable', () => {
    expect(renderMarkdown('::: quote post:14\nx\n:::', env)).toContain('markdown-quote-missing')
    expect(renderMarkdown('::: quote post:99\nx\n:::', env)).toContain('markdown-quote-missing')
    expect(renderMarkdown(':::: quote post:12\n::: tip\ninner\n:::\n::::', env)).toContain('markdown-container-callout')
  })
})

describe('Links and images', () => {
  it('marks external links nofollow ugc and keeps site links in the tab', () => {
    expect(renderMarkdown('[a](https://example.com)')).toContain('<a href="https://example.com" target="_blank" rel="nofollow ugc noopener noreferrer">')
    expect(renderMarkdown('[a](/works/1)')).toContain('<a href="/works/1">')
  })

  it('shows only https and site images, lazily and without a referrer', () => {
    expect(renderMarkdown('![pic](https://img.example/p.png)')).toContain('loading="lazy" referrerpolicy="no-referrer"')
    expect(renderMarkdown('![pic](http://img.example/p.png)')).toBe('<p>pic</p>\n')
    expect(renderMarkdown('![pic](/logo.png)')).toContain('<img src="/logo.png"')
  })
})

describe('Editor helpers', () => {
  it('quotes a post without its nested quotes, trimmed and fenced past inner blocks', () => {
    const raw = '::: quote post:1\nolder\n:::\n\nMy answer\n\n::: tip\nhint\n:::'
    expect(markdownQuote(9, raw)).toBe(':::: quote post:9\nMy answer\n\n::: tip\nhint\n:::\n::::\n\n')
    expect(markdownQuote(9, 'x'.repeat(20), 5)).toBe('::: quote post:9\nxxxxx…\n:::\n\n')
  })

  it('turns site page addresses into tokens', () => {
    expect(siteUrlToToken('https://dev.cdcat.net/works/12', 'localhost:3000')).toBe('[[work:12]]')
    expect(siteUrlToToken('/articles/4/liner-notes')).toBe('[[article:4]]')
    expect(siteUrlToToken('http://localhost:3000/discussions/8?post=3', 'localhost:3000')).toBe('[[topic:8]]')
    expect(siteUrlToToken('https://example.com/works/12', 'cdcat.net')).toBeNull()
    expect(siteUrlToToken('see /works/12')).toBeNull()
    expect(siteUrlToToken('/events/1')).toBeNull()
  })
})
