import type { EditorHelpEntry } from './types'
import zhHans from './zh-Hans'

export type { EditorHelpEntry, EditorHelpMock } from './types'

/** Written one language at a time, as the guides are: a language not here yet shows no help icons. */
const HELP: Record<string, Record<string, EditorHelpEntry>> = { 'zh-Hans': zhHans }

/** Every field's help, by id, in zh-Hans. */
export const editorHelpIds = Object.keys(zhHans)

export const editorHelp = (locale: string, id: string): EditorHelpEntry | undefined => HELP[locale]?.[id]
