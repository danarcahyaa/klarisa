import { createClient } from '@/lib/supabase/client'
import type { LoginDTO, RegisterDTO } from '@/types/auth.type'

export class AuthRepository {
  private get supabase() {
    return createClient()
  }

  /**
   * Register a new user using email and password.
   */
  async signUpWithEmail(data: RegisterDTO) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: data.full_name,
        },
      },
    })
  }

  /**
   * Authenticate a user using email and password credentials.
   */
  async signInWithEmail(data: LoginDTO) {
    return await this.supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
  }

  /**
   * Authenticate a user using an OAuth provider (Google).
   */
  async signInWithOAuth(provider: 'google' = 'google') {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  /**
   * Sign out the current authenticated user session.
   */
  async signOut() {
    return await this.supabase.auth.signOut()
  }

  /**
   * Retrieve current active session from the Supabase client.
   */
  async getCurrentSession() {
    return await this.supabase.auth.getSession()
  }

  /**
   * Retrieve current user data from Supabase Auth.
   */
  async getCurrentUser() {
    return await this.supabase.auth.getUser()
  }
}

export const authRepository = new AuthRepository()
