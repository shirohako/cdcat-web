import type { LyricFormat } from '~/types/lyric'

/** Display lines of a lyric: LRC time tags and SRT cue numbers and timings are dropped. */
export const lyricLines = (content: string, format: LyricFormat): string[] => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  if (format === 'lrc') {
    return lines
      .filter(line => !/^\[(ar|ti|al|by|offset|length|re|ve):/i.test(line))
      .map(line => line.replace(/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g, '').trimEnd())
  }
  if (format === 'srt') {
    return lines.filter(line => !/^\d+$/.test(line.trim()) && !/-->/.test(line))
  }
  return lines
}
