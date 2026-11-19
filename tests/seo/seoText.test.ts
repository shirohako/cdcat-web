import { describe, expect, it } from 'vitest'
import { composeDescription, creditedNames, descriptionLength, fillDescription, fitList, isAlternateTake, nameWithOriginal, plainText, truncateText, oneLine, textLanguage, writtenIn } from '../../app/utils/seoText'

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

  it('cuts CJK text at a 、 just before the limit, never back at a far space', () => {
    expect(truncateText('関連作品：『NEEDY GIRL OVERDOSE』。収録曲：「月虹蝶」、「INTERNET YAMERO」', 40)).toBe('関連作品：『NEEDY GIRL OVERDOSE』。収録曲：「月虹蝶」…')
    expect(truncateText('収録曲：『NEEDY GIRL OVERDOSE』、ほかにもたくさんの曲を収録しています', 30)).toBe('収録曲：『NEEDY GIRL OVERDOSE』…')
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

describe('fillDescription', () => {
  it('adds sentences in order while they fit, joining CJK ones without a space', () => {
    expect(fillDescription(['全3曲。', '収録曲：A、B。', 'CDCatで確認できます。'], 100)).toBe('全3曲。収録曲：A、B。CDCatで確認できます。')
    expect(fillDescription(['Album by X.', 'Tracks: A, B.'], 100)).toBe('Album by X. Tracks: A, B.')
  })

  it('leaves out a sentence that does not fit and still tries the shorter ones after it', () => {
    expect(fillDescription(['全3曲。', 'あいうえおかきくけこさしすせそ。', 'たちつ。'], 12)).toBe('全3曲。たちつ。')
  })

  it('cuts the first part when it alone is too long', () => {
    expect(fillDescription(['あいうえおかきくけこ', '次。'], 6)).toBe('あいうえお…')
  })

  it('lets a member\'s text fill the rest, after which nothing follows', () => {
    const text = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'
    expect(fillDescription(['全3曲。', { cut: text }, '次。'], 24)).toBe('全3曲。あいうえおかきくけこさしすせそたちつて…')
    expect(fillDescription(['全3曲。', { cut: '' }, '次。'], 9)).toBe('全3曲。次。')
  })

  it('takes a member\'s text whole when it fits, and goes on after it', () => {
    expect(fillDescription(['全3曲。', { cut: '本名罗赓。' }, '次。'], 20)).toBe('全3曲。本名罗赓。次。')
  })

  it('leaves out a member\'s text when too little room is left to cut it to', () => {
    expect(fillDescription(['全3曲。', { cut: 'あいうえおかきくけこさしすせそたちつてと' }, '次。'], 12)).toBe('全3曲。次。')
  })

  it('hands a function the room that is left', () => {
    const rooms: number[] = []
    fillDescription(['Album by X.', (room) => { rooms.push(room); return '' }], 40)
    expect(rooms).toEqual([28])
  })

  it('skips empty parts', () => {
    expect(fillDescription([null, '', false, 0, undefined, '全3曲。'], 20)).toBe('全3曲。')
  })
})

describe('fitList', () => {
  const format = (joined: string, more: boolean) => `収録曲：${joined}${more ? 'ほか' : ''}。`
  it('takes as many names as fit, saying when some are left out', () => {
    expect(fitList(['A', 'B', 'C'], 100, format, '、')).toBe('収録曲：A、B、C。')
    expect(fitList(['A', 'B', 'CCCC'], 10, format, '、')).toBe('収録曲：A、Bほか。')
    expect(fitList(['A', 'B', 'C'], 100, format, '、', 2)).toBe('収録曲：A、Bほか。')
  })

  it('drops empty and repeated names, and is empty when not one fits', () => {
    expect(fitList(['A', null, 'A', '', 'B'], 100, format, '、')).toBe('収録曲：A、B。')
    expect(fitList(['とても長い曲名'], 5, format, '、')).toBe('')
    expect(fitList([], 100, format, '、')).toBe('')
  })
})

describe('isAlternateTake', () => {
  it('spots instrumental, off vocal and karaoke versions', () => {
    expect(isAlternateTake('浸春芜 (Instrumental)')).toBe(true)
    expect(isAlternateTake('アンダーキッズ -off vocal-')).toBe(true)
    expect(isAlternateTake('Lunarmare (Inst.)')).toBe(true)
    expect(isAlternateTake('夜明け (カラオケ)')).toBe(true)
    expect(isAlternateTake('オフボーカル')).toBe(true)
  })

  it('leaves ordinary titles alone', () => {
    expect(isAlternateTake('Lunarmare')).toBe(false)
    expect(isAlternateTake('Install')).toBe(false)
    expect(isAlternateTake('Instrumentality')).toBe(false)
  })
})

describe('creditedNames', () => {
  const credit = (name: string, credited?: string) => ({ credited_as: credited ?? null, artist: { name } })
  it('puts the most credited first, keeping first appearance among equals', () => {
    expect(creditedNames([credit('A'), credit('B'), credit('B'), credit('C'), credit('A'), credit('B')])).toEqual(['B', 'A', 'C'])
  })

  it('uses the printed name and leaves out the ones to skip', () => {
    expect(creditedNames([credit('A', 'A (Vo)'), credit('X'), { credited_as: 'Z', artist: null }], ['X'])).toEqual(['A (Vo)', 'Z'])
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
