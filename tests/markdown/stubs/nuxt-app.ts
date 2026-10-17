import messages from '../../../i18n/locales/markdown/en.json'

function lookup(key: string): string | undefined {
  let node: unknown = messages
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[segment]
  }
  return typeof node === 'string' ? node : undefined
}

/** Stands in for `#app`: an app whose `$i18n` serves the English editor messages. */
export function tryUseNuxtApp() {
  return {
    $i18n: {
      locale: 'en',
      t: (key: string, named: Record<string, unknown> = {}) => {
        const message = lookup(key)
        if (message === undefined) return key
        return message.replace(/\{(\w+)\}/g, (match, name: string) => name in named ? String(named[name]) : match)
      },
    },
  }
}
