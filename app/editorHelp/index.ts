import type { EditorHelpEntry } from './types'
import en from './en'
import ja from './ja'
import ko from './ko'
import zhHans from './zh-Hans'
import zhHant from './zh-Hant'

export type { EditorHelpEntry, EditorHelpMock } from './types'

/** The help of every interface language, each with the same ids and fields; the drawings are in English for all of them. */
export const EDITOR_HELP: Record<string, Record<string, EditorHelpEntry>> = { 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja, en, ko }

/** Every field's help, by id. */
export const editorHelpIds = Object.keys(zhHans)

export const editorHelp = (locale: string, id: string): EditorHelpEntry | undefined => EDITOR_HELP[locale]?.[id]
