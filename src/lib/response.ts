import type { BaseResponse } from '@/types/response.type'

/**
 * Factory helper to construct a successful BaseResponse.
 */
export function createSuccessResponse<T>(data?: T | null, message?: string): BaseResponse<T> {
  return {
    success: true,
    data: data ?? null,
    message,
    error: null,
  }
}

/**
 * Factory helper to construct an error BaseResponse.
 */
export function createErrorResponse<T = null>(error: string, data: T | null = null): BaseResponse<T> {
  return {
    success: false,
    data,
    error,
    message: undefined,
  }
}

/**
 * Map native Supabase error messages to user-friendly localized messages.
 */
export function mapSupabaseError(errorMsg: string): string {
  if (!errorMsg) return 'Terjadi kesalahan'
  const lower = errorMsg.toLowerCase()

  if (lower.includes('500') || lower.includes('internal') || lower.includes('server error') || lower.includes('unexpected')) {
    return 'Terjadi kesalahan'
  }
  if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('email_exists')) {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.'
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email atau password yang Anda masukkan salah.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Email Anda belum dikonfirmasi. Harap periksa email Anda.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Harap tunggu beberapa saat sebelum mencoba lagi.'
  }
  if (lower.includes('password should be at least')) {
    return 'Password minimal harus 8 karakter.'
  }

  return errorMsg
}
