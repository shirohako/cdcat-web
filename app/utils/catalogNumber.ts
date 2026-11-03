/**
 * The one spelling of a catalog number, or of several, as the server keeps it (App\Support\CatalogNumber::format):
 * consecutive numbers with the same prefix become one range written with "~" and only the digits that change after
 * it ("DVSP-0324 / DVSP-0325 / DVSP-0326", "DVSP-0324〜0326" and "DVSP-0324/5/6" are all "DVSP-0324~6"); numbers
 * that are not consecutive stay apart as "ABC-1 / ABC-3". Full-width characters and dashes are folded, a value
 * without digits ("N/A") is kept as written.
 */

const MAX_EXPANSION = 100
const NUMBER = /^(.*?)(\d+)$/u

const clean = (value: string) => value.trim().normalize('NFKC')
  .replace(/[〜～∼]/g, '~')
  .replace(/[‐‑‒–—―−]/g, '-')
  .replace(/\s*~\s*/g, '~')
  .replace(/\s+/g, ' ')
  .trim()

/** A bare number after a separator ("62" in "KECH-8059~62") takes the prefix and leading digits of the one before it. */
function complete(part: string, previous: string | null): string {
  const p = previous === null ? null : NUMBER.exec(previous)
  if (!p || !/^\d+$/.test(part)) return part
  const digits = p[2]!
  return part.length < digits.length ? p[1]! + digits.slice(0, digits.length - part.length) + part : p[1]! + part
}

/** The digits of the last number that differ from the first ("0326" after "0324": "6"), all of them when it is longer. */
function tail(first: string, last: string): string {
  if (first.length !== last.length) return last
  let same = 0
  while (same < last.length - 1 && first[same] === last[same]) same++
  return last.slice(same)
}

type Slot = { text: string } | { prefix: string, width: number, numbers: Set<number> }

export function formatCatalogNumber(value: string | readonly (string | null | undefined)[] | null | undefined): string | null {
  const values = (Array.isArray(value) ? value : [value]).map(v => clean(String(v ?? ''))).filter(Boolean)
  if (!values.length) return null
  if (!/\d/.test(values.join(''))) return values.join(' / ')

  // Slots in the order they first appear: a prefix with its numbers (by value, keeping the first width), or a part kept as written.
  const slots = new Map<string, Slot>()
  const keep = (text: string) => slots.set(`s:${slots.size}`, { text })
  const add = (prefix: string, digits: string) => {
    const key = `n:${prefix}`
    if (!slots.has(key)) slots.set(key, { prefix, width: digits.length, numbers: new Set() })
    ;(slots.get(key) as { numbers: Set<number> }).numbers.add(Number(digits))
  }
  for (const v of values) {
    let previous: string | null = null
    for (const part of v.split(/\s*[/,、]\s*/u).filter(Boolean)) {
      const [first, second] = part.split(/~(.*)/s).map(s => s.trim())
      const start = complete(first!, previous)
      const end = second ? complete(second, start) : null
      previous = end ?? start
      const a = NUMBER.exec(start)
      if (!a) {
        keep(end === null ? start : `${start}~${end}`)
        continue
      }
      if (end === null) {
        add(a[1]!, a[2]!)
        continue
      }
      const b = NUMBER.exec(end)
      const from = Number(a[2])
      const to = b ? Number(b[2]) : NaN
      if (!b || b[1]!.toLowerCase() !== a[1]!.toLowerCase() || !(to > from) || to - from > MAX_EXPANSION) {
        // Too long, backwards or not one prefix: kept as one range, as short as it reads.
        keep(`${start}~${b && b[1] === a[1] ? tail(a[2]!, b[2]!) : end}`)
        continue
      }
      add(a[1]!, a[2]!)
      for (let n = from + 1; n <= to; n++) add(a[1]!, String(n))
    }
  }

  const out: string[] = []
  for (const slot of slots.values()) {
    if ('text' in slot) {
      out.push(slot.text)
      continue
    }
    const numbers = [...slot.numbers].sort((x, y) => x - y)
    const pad = (n: number) => String(n).padStart(slot.width, '0')
    for (let i = 0; i < numbers.length;) {
      let j = i
      while (j + 1 < numbers.length && numbers[j + 1] === numbers[j]! + 1) j++
      const first = pad(numbers[i]!)
      out.push(slot.prefix + first + (i === j ? '' : `~${tail(first, pad(numbers[j]!))}`))
      i = j + 1
    }
  }
  return out.join(' / ')
}
