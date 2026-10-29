/**
 * Password help for the sign-up and reset forms: a random password, and the hints shown while one is typed. Hints
 * never stop anyone; the API's only rule is the length (`min:8`).
 */

export const MIN_PASSWORD_LENGTH = 8

// No look-alikes (0 O o, 1 I l), so a generated password can be read off the screen and typed elsewhere
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!#$%&*+-=?@^_~'
export const PASSWORD_ALPHABET = LOWER + UPPER + DIGITS + SYMBOLS

/** A uniformly random whole number below `n`; rejection sampling keeps every value equally likely. */
function randomBelow(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n
  const buffer = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]!
  } while (value >= limit)
  return value % n
}

/** `length` random characters, at least one of each kind (lower case, upper case, digit, symbol). */
export function generatePassword(length = 16): string {
  const chars = [LOWER, UPPER, DIGITS, SYMBOLS].map(set => set[randomBelow(set.length)]!)
  while (chars.length < length) chars.push(PASSWORD_ALPHABET[randomBelow(PASSWORD_ALPHABET.length)]!)
  // Shuffle, so the guaranteed characters don't always come first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

/** Worst first. */
export type PasswordWarning = 'common' | 'sequence' | 'repeat' | 'nickname' | 'birthday' | 'year' | 'site'

export interface PasswordCheck {
  /** 0 (very weak) to 4 (very strong), for the meter */
  score: 0 | 1 | 2 | 3 | 4
  warnings: PasswordWarning[]
  longEnough: boolean
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', 'abcdefghijklmnopqrstuvwxyz']

/** Four or more keys in a row on the keyboard or in the alphabet, either way round. */
function hasSequence(lower: string): boolean {
  for (const row of ROWS) {
    for (const line of [row, [...row].reverse().join('')]) {
      for (let i = 0; i + 4 <= line.length; i++) {
        if (lower.includes(line.slice(i, i + 4))) return true
      }
    }
  }
  return false
}

/** The ways a birthday (YYYY-MM-DD) tends to turn up in a password. */
function birthdayParts(birthday: string): string[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday)
  if (!match) return []
  const [, y, m, d] = match as unknown as [string, string, string, string]
  return [`${y}${m}${d}`, `${y.slice(2)}${m}${d}`, `${d}${m}${y}`, `${m}${d}${y}`, `${m}${d}`, `${d}${m}`, y]
}

export function checkPassword(password: string, context: { nickname?: string, birthday?: string, common?: ReadonlySet<string> } = {}): PasswordCheck {
  const lower = password.toLowerCase()
  const warnings: PasswordWarning[] = []
  // Also the word under a tail of digits and symbols: "password123!" is still "password"
  const stem = lower.replace(/[\d\W_]+$/, '')
  if (context.common && (context.common.has(lower) || (stem.length >= MIN_PASSWORD_LENGTH && context.common.has(stem)))) warnings.push('common')
  if (hasSequence(lower)) warnings.push('sequence')
  if (/(.)\1\1/.test(lower) || /^(.{1,4})\1+$/.test(lower)) warnings.push('repeat')
  const nickname = context.nickname?.trim().toLowerCase() ?? ''
  if (nickname.length >= 3 && lower.includes(nickname)) warnings.push('nickname')
  const birthday = birthdayParts(context.birthday ?? '').some(part => password.includes(part))
  if (birthday) warnings.push('birthday')
  else if (/19[5-9]\d|20[0-4]\d/.test(password)) warnings.push('year')
  if (lower.includes('cdcat')) warnings.push('site')

  const length = password.length
  let score = length < MIN_PASSWORD_LENGTH ? 0 : length < 10 ? 1 : length < 12 ? 2 : length < 16 ? 3 : 4
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter(kind => kind.test(password)).length
  if (kinds <= 1) score -= 1
  else if (kinds >= 3 && length >= 10) score += 1
  if (warnings.includes('sequence') || warnings.includes('repeat')) score -= 2
  if (warnings.some(w => w === 'nickname' || w === 'birthday' || w === 'year' || w === 'site')) score -= 1
  if (warnings.includes('common')) score = 0

  return { score: Math.max(0, Math.min(4, score)) as PasswordCheck['score'], warnings, longEnough: length >= MIN_PASSWORD_LENGTH }
}

let commonList: Promise<ReadonlySet<string>> | undefined

/** The 10,000 most used passwords of 8+ characters (public/data/common-passwords.txt), fetched once, when first needed. */
export function loadCommonPasswords(): Promise<ReadonlySet<string>> {
  commonList ??= fetch('/data/common-passwords.txt')
    .then(response => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
    .then(text => new Set(text.split('\n').filter(line => line && !line.startsWith('#'))))
    .catch(() => {
      // Without the list the other hints still work; try again next time
      commonList = undefined
      return new Set<string>()
    })
  return commonList
}
