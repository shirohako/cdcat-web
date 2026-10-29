import { describe, expect, it } from 'vitest'
import { checkPassword, generatePassword, PASSWORD_ALPHABET } from '../../app/utils/password'

const COMMON = new Set(['password', '12345678', 'iloveyou', 'sunshine1'])

describe('generatePassword', () => {
  it('draws from the alphabet, without look-alikes, with every kind of character', () => {
    for (let i = 0; i < 200; i++) {
      const password = generatePassword()
      expect(password).toHaveLength(16)
      expect([...password].every(c => PASSWORD_ALPHABET.includes(c))).toBe(true)
      expect(password).not.toMatch(/[0O1Il o]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/\d/)
      expect(password).toMatch(/[^a-zA-Z\d]/)
    }
  })

  it('takes a length and does not repeat itself', () => {
    expect(generatePassword(24)).toHaveLength(24)
    expect(new Set(Array.from({ length: 100 }, () => generatePassword())).size).toBe(100)
  })

  it('passes its own checks', () => {
    for (let i = 0; i < 50; i++) {
      const check = checkPassword(generatePassword(), { common: COMMON })
      expect(check.score).toBeGreaterThanOrEqual(3)
      expect(check.warnings.filter(w => w === 'common' || w === 'nickname' || w === 'birthday' || w === 'site')).toEqual([])
    }
  })
})

describe('checkPassword', () => {
  it('flags common passwords, also under a tail of digits and symbols', () => {
    expect(checkPassword('Password', { common: COMMON })).toMatchObject({ score: 0, warnings: ['common'] })
    expect(checkPassword('password123!', { common: COMMON }).warnings).toContain('common')
  })

  it('flags runs, repeats and years', () => {
    expect(checkPassword('xx1234yy').warnings).toContain('sequence')
    expect(checkPassword('mnbvqwer').warnings).toContain('sequence')
    expect(checkPassword('zzz98765').warnings).toContain('repeat')
    expect(checkPassword('abababab').warnings).toContain('repeat')
    expect(checkPassword('sakura2024').warnings).toEqual(['year'])
  })

  it('flags the nickname, the birthday and the site name', () => {
    expect(checkPassword('Shiro-garden', { nickname: 'shiro' }).warnings).toContain('nickname')
    const birthday = checkPassword('river20010418', { birthday: '2001-04-18' }).warnings
    expect(birthday).toContain('birthday')
    expect(birthday).not.toContain('year')
    expect(checkPassword('my-CDCat-pass').warnings).toContain('site')
  })

  it('scores length and variety', () => {
    expect(checkPassword('short').longEnough).toBe(false)
    expect(checkPassword('glasslanternorbit').score).toBe(3)
    expect(checkPassword('Glass-lantern-orbit-7').score).toBe(4)
  })
})
