import { describe, expect, it } from 'vitest'
import { composeDescription, descriptionLength, nameWithOriginal, plainText, truncateText, oneLine, textLanguage, writtenIn } from '../../app/utils/seoText'

describe('plainText', () => {
  it('keeps the words of Markdown and drops its markup', () => {
    const markdown = [
      '## 简介',
      '',
      '> 引用 **加粗** 与 *斜体*，[链接文字](https://example.com) 和 [彩色]{.red}',
      '- 列表项 `代码`',
      '1. 第一',
      '![封面](https://example.com/a.png)',
      '[[album:13]]',
      '```js',
      'const hidden = true',
      '```',
      '::: details 展开',
      '内容',
      ':::',
    ].join('\n')
    expect(plainText(markdown)).toBe('简介 引用 加粗 与 斜体 ，链接文字 和 彩色 列表项 代码 第一 内容')
  })

  it('hides spoilers, or marks them where asked', () => {
    const markdown = '结局是||主角输了||。\n\n::: spoiler 剧透\n全部剧情\n:::\n后记'
    expect(plainText(markdown)).toBe('结局是。 后记')
    expect(plainText(markdown, { spoiler: '▇▇▇' })).toBe('结局是▇▇▇。 ▇▇▇ 后记')
  })

  it('is empty for nothing', () => {
    expect(plainText(null)).toBe('')
    expect(plainText(undefined)).toBe('')
  })
})

describe('truncateText', () => {
  it('leaves short text alone', () => {
    expect(truncateText('短い', 10)).toBe('短い')
  })

  it('cuts CJK text at the limit, counting characters rather than UTF-16 units', () => {
    const text = '𠮷'.repeat(5) + 'あいうえお'
    expect(truncateText(text, 6)).toBe('𠮷𠮷𠮷𠮷𠮷…')
  })

  it('cuts Latin text at a space near the end, without trailing punctuation', () => {
    expect(truncateText('A doujin album, released at M3 in spring', 20)).toBe('A doujin album…')
  })
})

describe('composeDescription', () => {
  it('puts the generated sentence first and joins CJK sentences without a space', () => {
    expect(composeDescription('全3曲。', '东方改编', 100)).toBe('全3曲。东方改编')
    expect(composeDescription('Album by X.', 'Arranged covers', 100)).toBe('Album by X. Arranged covers')
    expect(composeDescription('Album by X.', '', 100)).toBe('Album by X.')
  })

  it('cuts the user text, not the sentence, when it fits', () => {
    expect(composeDescription('全3曲。', 'あいうえおかきくけこ', 8)).toBe('全3曲。あいう…')
  })

  it('uses a shorter length for CJK locales', () => {
    expect(descriptionLength('en')).toBe(160)
    expect(descriptionLength('ja')).toBe(120)
  })
})

describe('nameWithOriginal', () => {
  const format = (name: string, original: string) => `${name}（${original}）`
  it('adds the original only when it differs', () => {
    expect(nameWithOriginal('东方改编', '東方アレンジ', format)).toBe('东方改编（東方アレンジ）')
    expect(nameWithOriginal('東方アレンジ', '東方アレンジ', format)).toBe('東方アレンジ')
    expect(nameWithOriginal('東方アレンジ', null, format)).toBe('東方アレンジ')
  })
})

describe('oneLine', () => {
  it('joins the lines and leaves the marks alone', () => {
    expect(oneLine('  *.· 星\n\n    **見た** \n')).toBe('*.· 星 **見た**')
  })

  it('is empty without text', () => {
    expect(oneLine(null)).toBe('')
  })
})

describe('textLanguage', () => {
  it('tells the language by the script most of the text is in', () => {
    expect(textLanguage('東方アレンジを集めたコンピレーションです。')).toBe('ja')
    expect(textLanguage('收录了十二首东方同人编曲。')).toBe('zh')
    expect(textLanguage('收錄了十二首東方同人編曲。')).toBe('zh')
    expect(textLanguage('동방 어레인지 12곡을 수록했습니다.')).toBe('ko')
    expect(textLanguage('Twelve Touhou arrangements.')).toBe('en')
  })

  it('is not tipped by a title quoted in another script', () => {
    expect(textLanguage('这张专辑收录了《アンダーキッズ》等十二首曲目，由多位编曲者共同完成制作。')).toBe('zh')
    expect(textLanguage('A compilation of twelve arrangements, including a new version of 幽雅に咲かせ、墨染の桜.')).toBe('en')
  })

  it('has no answer for text without letters', () => {
    expect(textLanguage('2026-04-26 / 12')).toBeNull()
    expect(textLanguage('')).toBeNull()
  })
})

describe('writtenIn', () => {
  it('matches a text to the interface language, both Chinese scripts alike', () => {
    expect(writtenIn('收录了十二首东方同人编曲。', 'zh-Hans')).toBe(true)
    expect(writtenIn('收录了十二首东方同人编曲。', 'zh-Hant')).toBe(true)
    expect(writtenIn('收录了十二首东方同人编曲。', 'ja')).toBe(false)
    expect(writtenIn('東方アレンジを集めたコンピレーションです。', 'ja')).toBe(true)
    expect(writtenIn('Twelve Touhou arrangements.', 'ko')).toBe(false)
  })

  it('lets text with no telling script through', () => {
    expect(writtenIn('2026', 'en')).toBe(true)
  })
})
