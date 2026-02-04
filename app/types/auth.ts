import type { User } from './user'

export type { User }

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
}

export interface AuthResponse {
  token: string
  user: User
}
