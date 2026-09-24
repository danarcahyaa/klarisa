'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { createClient } from '@/lib/supabase/client'
import type { LoginDTO, RegisterDTO, AuthUser, UseAuthReturn } from '@/types/auth.type'

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAuthGoogle, setIsAuthGoogle] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const router = useRouter()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Sync authentication state & user on initial mount
  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      try {
        const currentUser = await authService.getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('Failed to load current user:', err)
      }
    }

    loadCurrentUser()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser = authService.mapUserToAuthUser(session.user)
        if (isMounted) setUser(authUser)
      } else {
        if (isMounted) setUser(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Handler for email & password login.
   */
  const handleLogin = async (data: LoginDTO, redirectTo = '/dashboard'): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const response = await authService.login(data)

      if (!response.success) {
        setError(response.error || 'Login failed.')
        setIsLoading(false)
        return false
      }

      if (response.data) {
        setUser(response.data)
      }

      setIsSuccess(true)
      setIsLoading(false)
      const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/dashboard'
      router.push(safeRedirect)
      router.refresh()
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errMsg)
      setIsLoading(false)
      return false
    }
  }

  /**
   * Handler for new user registration.
   */
  const handleRegister = async (data: RegisterDTO): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const response = await authService.register(data)

      if (!response.success) {
        setError(response.error || 'Registration failed.')
        setIsLoading(false)
        return false
      }

      if (response.data) {
        setUser(response.data)
      }

      setIsSuccess(true)
      setIsLoading(false)
      // Redirect or show confirmation message
      router.push('/login?message=' + encodeURIComponent(response.message || 'Registration successful! Please log in.'))
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errMsg)
      setIsLoading(false)
      return false
    }
  }

  /**
   * Handler for Google OAuth login.
   */
  const handleGoogleLogin = async (redirectTo = '/dashboard'): Promise<void> => {
    setIsAuthGoogle(true)
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.loginWithGoogle(redirectTo)
      if (!response.success) {
        setError(response.error || 'Failed to connect with Google.')
        setIsLoading(false)
        setIsAuthGoogle(false)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to process Google authentication.'
      setError(errMsg)
      setIsLoading(false)
      setIsAuthGoogle(false)
    }
  }

  /**
   * Handler for user logout.
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.logout()
      if (!response.success) {
        setError(response.error || 'Logout failed.')
        setIsLoading(false)
      } else {
        setUser(null)
        router.push('/login')
        router.refresh()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred during logout.'
      setError(errMsg)
      setIsLoading(false)
    }
  }

  return {
    user,
    isAuthGoogle,
    isLoading,
    error,
    isSuccess,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    clearError,
  }
}
