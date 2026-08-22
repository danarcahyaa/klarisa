import type { Session as SupabaseSession } from '@supabase/supabase-js'
import type { Tables } from '@/types/database.type'
import type { BaseResponse } from '@/types/response.type'

export type ProfileRow = Tables<'profiles'>
export type AuthProvider = 'credentials' | 'google'

export interface LoginDTO {
  email: string
  password: string
}

export interface RegisterDTO {
  email: string
  password: string
  full_name: string
}

export interface AuthUser {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  provider?: AuthProvider
  created_at?: string
  profile?: ProfileRow | null
}

/**
 * AuthResponse inherits generic BaseResponse<T>
 */
export type AuthResponse<T = AuthUser> = BaseResponse<T>

export interface SessionPayload {
  user: AuthUser | null
  accessToken: string | null
  refreshToken?: string | null
  expiresAt?: number | null
  rawSession?: SupabaseSession | null
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  isSuccess: boolean
}

export interface UseAuthReturn {
  user: AuthUser | null
  isAuthGoogle: boolean
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  handleLogin: (data: LoginDTO, redirectTo?: string) => Promise<boolean>
  handleRegister: (data: RegisterDTO) => Promise<boolean>
  handleGoogleLogin: (redirectTo?: string) => Promise<void>
  handleLogout: () => Promise<void>
  clearError: () => void
}
