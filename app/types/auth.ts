import type { User } from './user'

export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  nickname: string
  email: string
  password: string
  verification_code: string
  birthday: string
  /** The interface language at sign-up, which becomes the mail language (en, ja, zh-Hans, zh-Hant). */
  locale?: string
}

export interface AuthResponse {
  token: string
  user: User
}
