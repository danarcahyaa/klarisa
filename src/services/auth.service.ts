import { authRepository, AuthRepository } from '@/repositories/auth.repository'
import { loginSchema, registerSchema } from '@/app/validations/auth.validation'
import { sanitizeEmail, sanitizeFullName } from '@/lib/utils'
import { createSuccessResponse, createErrorResponse, mapSupabaseError } from '@/lib/response'
import type { LoginDTO, RegisterDTO, AuthResponse, AuthUser } from '@/types/auth.type'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  /**
   * Convert Supabase User object to domain AuthUser model.
   */
  public mapUserToAuthUser(user: SupabaseUser): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      provider: (user.app_metadata?.provider as 'credentials' | 'google') || 'credentials',
      created_at: user.created_at,
    }
  }

  /**
   * User registration service method.
   */
  async register(data: RegisterDTO): Promise<AuthResponse<AuthUser>> {
    // 1. Validate input against Zod schema
    const validationResult = registerSchema.safeParse(data)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Input tidak valid.'
      return createErrorResponse(firstError)
    }

    // 2. Sanitize user inputs via utility functions (lib/utils.ts)
    const sanitizedData: RegisterDTO = {
      full_name: sanitizeFullName(data.full_name),
      email: sanitizeEmail(data.email),
      password: data.password,
    }

    // 3. Invoke repository data access layer
    const { data: resData, error } = await this.repo.signUpWithEmail(sanitizedData)

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message))
    }

    if (!resData.user) {
      return createErrorResponse('Gagal membuat akun. Silakan coba lagi.')
    }

    // When Supabase has Email Enumeration Protection enabled,
    // signUp for an already existing registered email returns an empty identities array.
    if (resData.user.identities && resData.user.identities.length === 0) {
      return createErrorResponse('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.')
    }

    const authUser = this.mapUserToAuthUser(resData.user)
    return createSuccessResponse(authUser, 'Registrasi berhasil. Silakan cek email Anda untuk konfirmasi.')
  }

  /**
   * User login service method via email & password.
   */
  async login(data: LoginDTO): Promise<AuthResponse<AuthUser>> {
    // 1. Validate input against Zod schema
    const validationResult = loginSchema.safeParse(data)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Input tidak valid.'
      return createErrorResponse(firstError)
    }

    // 2. Sanitize user inputs via utility functions (lib/utils.ts)
    const sanitizedData: LoginDTO = {
      email: sanitizeEmail(data.email),
      password: data.password,
    }

    // 3. Invoke repository data access layer
    const { data: resData, error } = await this.repo.signInWithEmail(sanitizedData)

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message))
    }

    if (!resData.user) {
      return createErrorResponse('Sesi tidak dapat ditemukan.')
    }

    const authUser = this.mapUserToAuthUser(resData.user)
    return createSuccessResponse(authUser, 'Berhasil masuk ke akun Anda.')
  }

  /**
   * User OAuth Google authentication service method.
   */
  async loginWithGoogle(redirectTo = '/dashboard'): Promise<AuthResponse<null>> {
    const { error } = await this.repo.signInWithOAuth('google', redirectTo)
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message))
    }
    return createSuccessResponse(null, 'Mengalihkan ke halaman autentikasi Google...')
  }

  /**
   * User sign out service method.
   */
  async logout(): Promise<AuthResponse<null>> {
    const { error } = await this.repo.signOut()
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message))
    }
    return createSuccessResponse(null, 'Berhasil keluar dari akun.')
  }

  /**
   * Fetch current authenticated user.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await this.repo.getCurrentUser()
    if (!data?.user) return null
    return this.mapUserToAuthUser(data.user)
  }
}

export const authService = new AuthService()
